import {
    Action,
    ActionHandler,
    GLSPServerError,
    MaybePromise,
    ModelSubmissionHandler,
    RequestAction,
    ResponseAction
} from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../kuber/client.js';
import * as ast from '../../../language-server/generated/ast.js';
import {
    addEdgeAttribute,
    addNodeAttribute,
    createClusterNode,
    createContainerNode,
    createIngressNode,
    createPodNode,
    createPortNode,
    createServiceNode
} from '../model/graph-extension/utils.js';
import { KDLModelState } from '../model/kdl-state.js';

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

    @inject(KDLModelState)
    protected modelState: KDLModelState;

    @inject(ModelSubmissionHandler)
    protected modelSubmissionHandler: ModelSubmissionHandler;

    execute(action: KuberRecoverRequestAction): MaybePromise<Action[]> {
        return this.kuberClient
            .getNamespaces()
            .then(namespaces => this.recoverCluster(namespaces))
            .then(() => {
                // this.modelState.updateSourceModel(this.modelState.sourceModel);
                return [];
            });
        // .then(() => {
        //     const result = this.modelSubmissionHandler.submitModel('external');
        //     return result;
        // });
    }

    private async recoverPods(cluster: ast.ClusterNode): Promise<void> {
        try {
            const podsList = await this.kuberClient.getPods(cluster.name);
            for (const kuberPod of podsList.items) {
                const pod = createPodNode(this.modelState.kdlDiagram, kuberPod.metadata?.name);
                this.modelState.kdlDiagram.model!.pods.push(pod);
                cluster.pods.push({ ref: pod, $refText: this.modelState.idProvider.getLocalId(pod)! });
                if (kuberPod.spec?.containers) {
                    this.recoverContainers(pod, kuberPod.spec.containers);
                }
                addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, pod);
            }
            // await this.modelState.updateSourceModel(this.modelState.sourceModel);
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    private recoverContainers(pod: ast.PodNode, kuberContainers: k8s.V1Container[]): void {
        kuberContainers?.map(kuberContainer => {
            const container = createContainerNode(this.modelState.kdlDiagram, kuberContainer.name);
            this.modelState.kdlDiagram.model!.containers.push(container);
            pod.containers.push({ ref: container, $refText: this.modelState.idProvider.getLocalId(container)! });
            if (kuberContainer.ports) {
                this.recoverPodPorts(pod, kuberContainer.ports, kuberContainers.length);
            }
            addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, container);
        });
    }

    private recoverPodPorts(pod: ast.PodNode, kuberPorts: k8s.V1ContainerPort[], numContainers: number): void {
        kuberPorts?.map(kuberPort => {
            const port = createPortNode(pod, kuberPort.containerPort, kuberPort.name);
            pod.ports.push(port);
            addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, port);
        });
    }

    private recoverServicePorts(service: ast.ServiceNode, kuberPorts: k8s.V1ServicePort[]): void {
        kuberPorts?.map(kuberPort => {
            const port = createPortNode(service, kuberPort.port, kuberPort.name);
            service.ports.push(port);
            addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, port);
        });
    }

    private async recoverServiceToPodLinks(
        namespace: string,
        service: ast.ServiceNode,
        kuberService: k8s.V1Service,
        kuberPorts: k8s.V1ServicePort[]
    ): Promise<void> {
        const selector = kuberService.spec?.selector || {};
        const selectorKeys = Object.keys(selector);
        const matchedKuberPods = (await this.kuberClient.getPods(namespace)).items.filter(pod => {
            const podLabels = pod.metadata?.labels || {};
            return selectorKeys.every(key => podLabels[key] === selector[key]);
        });

        const targetPods = this.modelState.kdlDiagram.model!.pods.filter(pod =>
            matchedKuberPods.some(kuberPod => kuberPod.metadata?.name === pod.name)
        );
        const targetPorts = targetPods
            .flatMap(pod => pod.ports)
            .filter(
                (port): port is ast.PortNode =>
                    port !== undefined &&
                    kuberPorts.some(kuberPort => kuberPort.targetPort === port.number || kuberPort.targetPort?.toString() === port.name)
            );

        targetPorts.forEach(port => {
            service.links.push({ ref: port, $refText: this.modelState.idProvider.getLocalId(port)! });
            addEdgeAttribute(
                this.modelState.kdlDiagram,
                this.modelState.idProvider.getLocalId(service)!,
                this.modelState.idProvider.getLocalId(port)!,
                service,
                port
            );
        });
    }

    private async recoverServices(cluster: ast.ClusterNode): Promise<void> {
        try {
            const serviceList = await this.kuberClient.getServices(cluster.name);
            for (const kuberService of serviceList.items) {
                const service = createServiceNode(this.modelState.kdlDiagram, kuberService.metadata?.name);
                this.modelState.kdlDiagram.model!.services.push(service);
                cluster.services.push({ ref: service, $refText: this.modelState.idProvider.getLocalId(service)! });
                if (kuberService.spec?.ports) {
                    this.recoverServicePorts(service, kuberService.spec.ports);
                    await this.recoverServiceToPodLinks(cluster.name, service, kuberService, kuberService.spec.ports);
                    addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, service);
                }
            }
            // await this.modelState.updateSourceModel(this.modelState.sourceModel);
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    private async recoverIngressToServiceLink(
        paths: k8s.V1HTTPIngressPath[] | undefined,
        cluster: ast.ClusterNode,
        ingress: ast.IngressNode
    ): Promise<void> {
        if (!paths) {
            return;
        }
        for (const path of paths) {
            const serviceName = path.backend?.service?.name;
            const servicePortNumber = path.backend?.service?.port?.number;
            const servicePortName = path.backend?.service?.port?.name;

            const targetService = cluster.services
                .map(service => service.ref)
                .filter((service): service is ast.ServiceNode => service !== undefined && service.name === serviceName)
                .at(0);
            if (!targetService) {
                console.error(`Service ${serviceName} not found while recovering ingress ${ingress.name} to the service link`);
                continue;
            }

            const targetPorts = targetService.ports.filter(
                (port): port is ast.PortNode => port !== undefined && (port.name === servicePortName || port.number === servicePortNumber)
            );
            targetPorts.map(port => {
                ingress.links.push({ ref: port, $refText: this.modelState.idProvider.getLocalId(port)! });
                addEdgeAttribute(
                    this.modelState.kdlDiagram,
                    this.modelState.idProvider.getLocalId(ingress)!,
                    this.modelState.idProvider.getLocalId(port)!,
                    ingress,
                    port
                );
            });
        }
    }

    private async recoverIngresses(cluster: ast.ClusterNode): Promise<void> {
        try {
            const ingressList = await this.kuberClient.getIngresses(cluster.name);
            for (const kuberIngress of ingressList.items) {
                const ingressName = kuberIngress.metadata?.name;
                for (const rule of kuberIngress.spec?.rules || []) {
                    if (rule.host) {
                        const ingress = createIngressNode(this.modelState.kdlDiagram, ingressName, rule.host);
                        this.modelState.kdlDiagram.model!.ingresses.push(ingress);
                        cluster.ingresses.push({ ref: ingress, $refText: this.modelState.idProvider.getLocalId(ingress)! });
                        await this.recoverIngressToServiceLink(rule.http?.paths, cluster, ingress);
                        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, ingress);
                    }
                }
            }
            // await this.modelState.updateSourceModel(this.modelState.sourceModel);
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    private async recoverCluster(namespaces: string[]): Promise<void> {
        const clusters: ast.ClusterNode[] = [];
        namespaces
            .filter(namespace => !namespace.startsWith('kube'))
            .map(namespace => {
                const cluster = createClusterNode(this.modelState.kdlDiagram, namespace);
                this.modelState.kdlDiagram.model!.clusters.push(cluster);
                clusters.push(cluster);
                addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, cluster);
            });

        await Promise.all(clusters.map(cluster => this.recoverPods(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverServices(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverIngresses(cluster)));

        await this.modelState.updateSourceModel(this.modelState.sourceModel);
    }
}
