/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import {
    Action,
    ActionHandler,
    GLSPServerError,
    MaybePromise,
    ModelSubmissionHandler,
    RequestAction,
    ResponseAction
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../kuber/client';
import { TaskListModelState } from '../model/tasklist-model-state';
import { Cluster, Pod, Port, Container, Service, Ingress, Link } from '../model/tasklist-model';
import * as k8s from '@kubernetes/client-node';

export interface KuberRecoverRequestAction extends RequestAction<KuberRecoverResponseAction> {
    kind: typeof KuberRecoverRequestAction.KIND;
}

export namespace KuberRecoverRequestAction {
    export const KIND = 'kuberRecoverKind';
    export function is(object: any): object is KuberRecoverRequestAction {
        return RequestAction.hasKind(object, KIND);
    }
    export function create(options: { requestId?: string }): KuberRecoverRequestAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

export interface KuberRecoverResponseAction extends ResponseAction {
    kind: typeof KuberRecoverResponseAction.KIND;
}

export namespace KuberRecoverResponseAction {
    export const KIND = 'kuberRecoverResponse';

    export function is(object: any): object is KuberRecoverResponseAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { responseId?: string } = {}): KuberRecoverResponseAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}

@injectable()
export class KuberRecoverActionHandler implements ActionHandler {
    actionKinds = [KuberRecoverRequestAction.KIND];

    @inject(KuberClient)
    protected kuberClient: KuberClient;

    @inject(TaskListModelState)
    protected modelState: TaskListModelState;

    @inject(ModelSubmissionHandler)
    protected modelSubmissionHandler: ModelSubmissionHandler;

    execute(action: KuberRecoverRequestAction): MaybePromise<Action[]> {
        return this.kuberClient
            .getNamespaces()
            .then(namespaces => this.recoverCluster(namespaces))
            .then(() => {
                const result = this.modelSubmissionHandler.submitModel('external');
                return result;
            });
    }

    private async recoverPods(cluster: Cluster): Promise<void> {
        try {
            const podsList = await this.kuberClient.getPods(cluster.name);
            podsList.items.forEach((kuberPod, idx) => {
                const pod = Pod.create(idx, kuberPod.metadata?.name);
                cluster.pod_ids.push(pod.id);
                this.modelState.sourceModel.pods.push(pod);
                if (kuberPod.spec?.containers) {
                    this.recoverContainers(pod, kuberPod.spec.containers);
                }
            });
            this.modelState.updateSourceModel(this.modelState.sourceModel);
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    private recoverContainers(pod: Pod, kuberContainers: k8s.V1Container[]): void {
        kuberContainers?.forEach((kuberContainer, idx) => {
            const container = Container.create(kuberContainer.name, idx);
            this.modelState.sourceModel.containers.push(container);
            pod.container_ids.push(container.id);
            if (kuberContainer.ports) {
                this.recoverPodPorts(pod, kuberContainer.ports, kuberContainers.length);
            }
        });
    }

    private recoverPodPorts(pod: Pod, kuberPorts: k8s.V1ContainerPort[], numContainers: number): void {
        kuberPorts?.forEach((kuberPort, idx) => {
            const port = Port.create(kuberPort.containerPort.toString(), numContainers + idx, kuberPort.name);
            this.modelState.sourceModel.ports.push(port);
            pod.port_ids.push(port.id);
        });
    }

    private recoverServicePorts(service: Service, kuberPorts: k8s.V1ServicePort[]): void {
        kuberPorts?.forEach((kuberPort, idx) => {
            const port = Port.create(kuberPort.port.toString(), idx, kuberPort.name);
            this.modelState.sourceModel.ports.push(port);
            service.port_ids.push(port.id);
        });
    }

    private async recoverServiceToPodLinks(
        namespace: string,
        service: Service,
        kuberService: k8s.V1Service,
        kuberPorts: k8s.V1ServicePort[]
    ): Promise<void> {
        const selector = kuberService.spec?.selector || {};
        const selectorKeys = Object.keys(selector);
        const matchedKuberPods = (await this.kuberClient.getPods(namespace)).items.filter(pod => {
            const podLabels = pod.metadata?.labels || {};
            return selectorKeys.every(key => podLabels[key] === selector[key]);
        });

        const targetPods = this.modelState.sourceModel.pods.filter(pod =>
            matchedKuberPods.some(kuberPod => kuberPod.metadata?.name === pod.name)
        );
        const targetPorts = targetPods
            .flatMap(pod => pod.port_ids.map(portId => this.modelState.index.findPort(portId)))
            .filter(
                (port): port is Port =>
                    port !== undefined &&
                    kuberPorts.some(
                        kuberPort => kuberPort.targetPort?.toString() === port.number || kuberPort.targetPort?.toString() === port.name
                    )
            );

        targetPorts.forEach(port => this.modelState.sourceModel.links.push(Link.create(service.id, port.id)));
    }

    private async recoverServices(cluster: Cluster): Promise<void> {
        try {
            const serviceList = await this.kuberClient.getServices(cluster.name);
            serviceList.items.forEach((kuberService, idx) => {
                const service = Service.create(idx + cluster.pod_ids.length, kuberService.metadata?.name);
                cluster.service_ids.push(service.id);
                this.modelState.sourceModel.services.push(service);
                if (kuberService.spec?.ports) {
                    this.recoverServicePorts(service, kuberService.spec.ports);
                    this.recoverServiceToPodLinks(cluster.name, service, kuberService, kuberService.spec.ports);
                }
                this.modelState.updateSourceModel(this.modelState.sourceModel);
            });
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    private async recoverIngressToServiceLink(
        paths: k8s.V1HTTPIngressPath[] | undefined,
        cluster: Cluster,
        ingress: Ingress
    ): Promise<void> {
        if (!paths) {
            return;
        }
        for (const path of paths) {
            const serviceName = path.backend?.service?.name;
            const servicePortNumber = path.backend?.service?.port?.number;
            const servicePortName = path.backend?.service?.port?.name;

            const targetService = cluster.service_ids
                .flatMap(serviceID => this.modelState.index.findService(serviceID))
                .filter((service): service is Service => service !== undefined && service.name === serviceName)
                .at(0);
            if (!targetService) {
                console.error(`Service ${serviceName} not found while recovering ingress ${ingress.name} to the service link`);
                continue;
            }

            const targetPorts = targetService.port_ids
                .flatMap(portId => this.modelState.index.findPort(portId))
                .filter(
                    (port): port is Port =>
                        port !== undefined && (port.name === servicePortName || port.number === servicePortNumber?.toString())
                );
            targetPorts.forEach(port => this.modelState.sourceModel.links.push(Link.create(ingress.id, port.id)));
        }
    }

    private async recoverIngresses(cluster: Cluster): Promise<void> {
        try {
            const ingressList = await this.kuberClient.getIngresses(cluster.name);
            ingressList.items.forEach((kuberIngress, idx) => {
                const ingressName = kuberIngress.metadata?.name;
                kuberIngress.spec?.rules?.forEach(rule => {
                    if (rule.host) {
                        const ingress = Ingress.create(rule.host, idx + cluster.service_ids.length + cluster.pod_ids.length, ingressName);
                        cluster.ingress_ids.push(ingress.id);
                        this.modelState.sourceModel.ingresses.push(ingress);
                        this.recoverIngressToServiceLink(rule.http?.paths, cluster, ingress);
                    }
                });
            });
            this.modelState.updateSourceModel(this.modelState.sourceModel);
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    private async recoverCluster(namespaces: string[]): Promise<void> {
        const clusters = namespaces
            .filter(namespace => !namespace.startsWith('kube'))
            .map((namespace, idx) => Cluster.create(namespace, idx));

        await Promise.all(clusters.map(cluster => this.recoverPods(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverServices(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverIngresses(cluster)));

        this.modelState.sourceModel.clusters.push(...clusters);
    }
}
