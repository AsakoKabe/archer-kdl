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
import { KDLModelState } from '../model/kdl-state.js';
import {
    addEdgeAttribute,
    addNodeAttribute,
    createClusterNode,
    createContainerNode,
    createIngressNode,
    createPodNode,
    createPortNode,
    createServiceNode,
    createVolumeNode,
    VolumeType
} from '../model/utils.js';

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
                return [];
            });
    }

    private async recoverCluster(namespaces: string[]): Promise<void> {
        const clusters: ast.ClusterNode[] = [];
        namespaces
            .filter(namespace => !namespace.startsWith('kube'))
            .map(namespace => {
                const cluster = createClusterNode(this.modelState.kdlDiagram, namespace);
                this.modelState.kdlDiagram.clusters.push(cluster);
                clusters.push(cluster);
                addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, cluster);
            });

        await Promise.all(clusters.map(cluster => this.recoverPods(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverServices(cluster)));
        await Promise.all(clusters.map(cluster => this.recoverIngresses(cluster)));

        await this.modelState.updateSourceModel(this.modelState.sourceModel);
    }

    private async recoverPods(cluster: ast.ClusterNode): Promise<void> {
        try {
            const pods = await this.kuberClient.getPods(cluster.name);
            for (const kuberPod of pods.items) {
                const controller = await this.kuberClient.getPodController(kuberPod, cluster.name);
                const pod = createPodNode(cluster, kuberPod.metadata?.name, controller?.kind, String(controller?.spec?.replicas));
                const kubeContainers = kuberPod.spec?.containers || [];
                this.recoverVolumes(kuberPod, kubeContainers, pod);

                cluster.pods.push(pod);
                if (kuberPod.spec?.containers) {
                    this.recoverContainers(pod, kubeContainers);
                }
                addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, pod);
                if (pod.cardinality) {
                    addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, pod.cardinality);
                }
                if (pod.controller) {
                    addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, pod.controller);
                }
            }
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    private recoverVolumes(kuberPod: k8s.V1Pod, kubeContainers: k8s.V1Container[], pod: ast.PodNode): void {
        const volumes = new Set<{ name: string; type: string }>();
        kuberPod.spec?.volumes?.forEach(volume => {
            if (volume.secret?.secretName) {
                volumes.add({ name: volume.secret.secretName, type: VolumeType.Secret });
            }
            if (volume.configMap?.name) {
                volumes.add({ name: volume.configMap.name, type: VolumeType.ConfigMap });
            }
        });
        if (kubeContainers) {
            kubeContainers.forEach(container => {
                if (container.env) {
                    container.env.forEach(envVar => {
                        if (envVar.valueFrom?.secretKeyRef?.name) {
                            volumes.add({ name: envVar.valueFrom.secretKeyRef.name, type: VolumeType.Secret });
                        }
                        if (envVar.valueFrom?.configMapKeyRef?.name) {
                            volumes.add({ name: envVar.valueFrom.configMapKeyRef.name, type: VolumeType.ConfigMap });
                        }
                    });
                }

                if (container.envFrom) {
                    container.envFrom.forEach(envFrom => {
                        if (envFrom.secretRef?.name) {
                            volumes.add({ name: envFrom.secretRef.name, type: VolumeType.Secret });
                        }
                        if (envFrom.configMapRef?.name) {
                            volumes.add({ name: envFrom.configMapRef.name, type: VolumeType.ConfigMap });
                        }
                    });
                }
            });
        }

        volumes.forEach(volume => {
            const volumeNode = createVolumeNode(pod, volume.name, volume.type as VolumeType);
            pod.volumes.push(volumeNode);
            addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, volumeNode);
        })
    }

    private recoverContainers(pod: ast.PodNode, kuberContainers: k8s.V1Container[]): void {
        kuberContainers?.map(kuberContainer => {
            const container = createContainerNode(pod, kuberContainer.name);
            pod.containers.push(container);
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

    private async recoverServices(cluster: ast.ClusterNode): Promise<void> {
        try {
            const serviceList = await this.kuberClient.getServices(cluster.name);
            for (const kuberService of serviceList.items) {
                const service = createServiceNode(cluster, kuberService.metadata?.name, kuberService.spec?.type);
                cluster.services.push(service);
                if (kuberService.spec?.ports) {
                    this.recoverServicePorts(service, kuberService.spec.ports);
                    await this.recoverServiceToPodLinks(cluster.name, cluster, service, kuberService, kuberService.spec.ports);
                    addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, service);
                    if (service.type) {
                        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, service.type);
                    }
                }
            }
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
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
        cluster: ast.ClusterNode,
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

        const targetPods = cluster.pods.filter(pod => matchedKuberPods.some(kuberPod => kuberPod.metadata?.name === pod.name));
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

    private async recoverIngresses(cluster: ast.ClusterNode): Promise<void> {
        try {
            const ingressList = await this.kuberClient.getIngresses(cluster.name);
            for (const kuberIngress of ingressList.items) {
                const ingressName = kuberIngress.metadata?.name;
                for (const rule of kuberIngress.spec?.rules || []) {
                    if (rule.host) {
                        const ingress = createIngressNode(cluster, ingressName, rule.host);
                        cluster.ingresses.push(ingress);
                        await this.recoverIngressToServiceLink(rule.http?.paths, cluster, ingress);
                        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, ingress);
                    }
                }
            }
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
}
