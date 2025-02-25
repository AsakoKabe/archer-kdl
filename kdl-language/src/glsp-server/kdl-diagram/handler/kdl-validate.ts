import { GGraph, GModelElement, Marker, MarkerKind, MarkersReason, ModelState, ModelValidator } from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../kuber/client.js';
import { IngressNode } from '../model/graph-extension/ingress-node.js';
import { NamespaceNode } from '../model/graph-extension/namespace-node.js';
import { PodNode } from '../model/graph-extension/pod-node.js';
import { PortNode } from '../model/graph-extension/port-node.js';
import { ServiceNode } from '../model/graph-extension/service-node.js';
import { KDLModelState } from '../model/kdl-state.js';
import { getFullServiceTypeName } from './create-service-type-operation-handler.js';

@injectable()
export class KDLModelValidator implements ModelValidator {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    @inject(ModelState) declare protected modelState: KDLModelState;

    async validate(elements: GModelElement[], reason: string): Promise<Marker[]> {
        const markers: Marker[] = [];

        for (const element of elements) {
            if (MarkersReason.BATCH === reason) {
                markers.push(...(await this.doBatchValidation(element)));
            }
            if (element.children) {
                markers.push(...(await this.validate(element.children, reason)));
            }
        }
        return markers;
    }

    async doBatchValidation(element: GModelElement): Promise<Marker[]> {
        if (element instanceof GGraph) {
            return await this.validateRoot(element);
        } else if (element instanceof NamespaceNode) {
            return await this.validateNamespace(element);
        }

        return [];
    }

    private async validateRoot(root: GGraph): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        const modelNamespaces = this.getModelNamespaces(root);
        const notFoundNamespaces = this.getNotFoundNamespaces(clusterNamespaces, modelNamespaces);

        const markers: Marker[] = [];
        this.addNamespaceNotFoundMarkers(notFoundNamespaces, root, markers);
        this.addNamespaceMismatchMarkers(clusterNamespaces, modelNamespaces, markers);

        return markers;
    }

    private getModelNamespaces(root: GGraph): NamespaceNode[] {
        return root.children.reduce((namespaces: NamespaceNode[], child) => {
            if (child instanceof NamespaceNode) {
                namespaces.push(child);
            }
            return namespaces;
        }, []);
    }

    private getNotFoundNamespaces(clusterNamespaces: string[], modelNamespaces: NamespaceNode[]): string[] {
        const modelNamespaceNames = modelNamespaces.map(namespace => namespace.name);
        return clusterNamespaces.filter(name => !modelNamespaceNames.includes(name));
    }

    private createErrorMessage(entity: string, name: string, context: string): string {
        const otherContext = context === 'model' ? 'cluster' : 'model';
        return `"${name}" ${entity} does not found in ${context}, but it exists in the ${otherContext}`;
    }

    private addNamespaceNotFoundMarkers(notFoundNamespaces: string[], root: GGraph, markers: Marker[]): void {
        notFoundNamespaces.map(name => {
            markers.push({
                kind: MarkerKind.ERROR,
                description: this.createErrorMessage('namespace', name, 'model'),
                elementId: root.id,
                label: 'Not found'
            });
        });
    }

    private addNamespaceMismatchMarkers(clusterNamespaces: string[], modelNamespaces: NamespaceNode[], markers: Marker[]): void {
        modelNamespaces.forEach(namespace => {
            if (!clusterNamespaces.includes(namespace.name)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: this.createErrorMessage('namespace', namespace.name, 'cluster'),
                    elementId: namespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateNamespace(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        if (!clusterNamespaces.includes(modelNamespace.name)) {
            return [];
        }
        const markers: Marker[] = [];

        markers.push(...(await this.validateIngresses(modelNamespace)));
        markers.push(...(await this.validateServices(modelNamespace)));
        markers.push(...(await this.validatePods(modelNamespace)));

        return markers;
    }

    private async validatePods(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberPods = await this.kuberClient.getPods(modelNamespace.name);
        this.addPodNotFoundMarkers(kuberPods, modelNamespace, markers);
        for (const podNode of modelNamespace.podNodes) {
            markers.push(...(await this.validatePod(podNode, kuberPods)));
        }
        return markers;
    }

    private addPodNotFoundMarkers(kuberPods: k8s.V1Pod[], modelNamespace: NamespaceNode, markers: Marker[]): void {
        kuberPods.forEach(clusterPod => {
            const clusterPodName = clusterPod.metadata?.name;
            if (!clusterPodName) {
                return;
            }
            if (!modelNamespace.podNodes.map(podNode => podNode.name).includes(clusterPodName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: this.createErrorMessage('pod', clusterPodName, 'model'),
                    elementId: modelNamespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateServices(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberServices = await this.kuberClient.getServices(modelNamespace.name);
        this.addServiceNotFoundMarkers(kuberServices, modelNamespace, markers);
        for (const serviceNode of modelNamespace.serviceNodes) {
            markers.push(...(await this.validateService(serviceNode, kuberServices)));
        }
        return markers;
    }

    private addServiceNotFoundMarkers(kuberServices: k8s.V1Service[], modelNamespace: NamespaceNode, markers: Marker[]): void {
        kuberServices.forEach(clusterService => {
            const clusterServiceName = clusterService.metadata?.name;
            if (!clusterServiceName) {
                return;
            }
            if (!modelNamespace.serviceNodes.map(serviceNode => serviceNode.name).includes(clusterServiceName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: this.createErrorMessage('service', clusterServiceName, 'model'),
                    elementId: modelNamespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateIngresses(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberIngresses = await this.kuberClient.getIngresses(modelNamespace.name);
        this.addIngressNotFoundMarkers(kuberIngresses, modelNamespace, markers);
        for (const modelIngress of modelNamespace.ingressNodes) {
            markers.push(...(await this.validateIngress(modelIngress, kuberIngresses)));
        }
        return markers;
    }

    private addIngressNotFoundMarkers(kuberIngresses: k8s.V1Ingress[], modelNamespace: NamespaceNode, markers: Marker[]): void {
        kuberIngresses.forEach(kuberIngress => {
            const kuberIngressName = kuberIngress.metadata?.name;
            if (!kuberIngressName) {
                return;
            }
            if (!modelNamespace.ingressNodes.map(ingressNode => ingressNode.name).includes(kuberIngressName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: this.createErrorMessage('ingress', kuberIngressName, 'model'),
                    elementId: modelNamespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateIngress(ingress: IngressNode, clusterIngresses: k8s.V1Ingress[]): Promise<Marker[]> {
        const markers: Marker[] = [];

        const clusterIngress = clusterIngresses.find(clusterIngress => clusterIngress.metadata?.name === ingress.name);
        if (!clusterIngress) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: this.createErrorMessage('ingress', ingress.name, 'cluster'),
                elementId: ingress.id,
                label: 'Not found'
            });
        } else {
            const hosts = clusterIngress.spec?.rules?.map(rule => rule.host);
            if (!hosts || !hosts.includes(ingress.host)) {
                return [
                    {
                        kind: MarkerKind.ERROR,
                        description: this.createErrorMessage('host', ingress.host, 'cluster'),
                        elementId: ingress.id,
                        label: 'Not found'
                    }
                ];
            }
        }

        return markers;
    }

    private async validateService(serviceNode: ServiceNode, kuberServices: k8s.V1Service[]): Promise<Marker[]> {
        const markers: Marker[] = [];

        const kuberService = kuberServices.find(kuberService => kuberService.metadata?.name === serviceNode.name);
        if (!kuberService) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: this.createErrorMessage('ingress', serviceNode.name, 'cluster'),
                elementId: serviceNode.id,
                label: 'Not found'
            });
        } else {
            this.addServicePortNotFoundMarkers(kuberService, serviceNode, markers);
            for (const port of serviceNode.portNodes) {
                markers.push(...(await this.validatePort(serviceNode, port, kuberService.spec?.ports || [])));
            }
            this.addServiceTypeMismatchMarkers(kuberService, serviceNode, markers);
        }

        return markers;
    }

    private addServicePortNotFoundMarkers(kuberService: k8s.V1Service, serviceNode: ServiceNode, markers: Marker[]): void {
        (kuberService.spec?.ports || []).forEach(kuberPort => {
            const kuberPortNumber = kuberPort.port;
            if (!serviceNode.portNodes.map(portNode => portNode.number.toString()).includes(kuberPortNumber.toString())) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The port: ${kuberPortNumber} of service: ${serviceNode.name} in cluster does not found in model`,
                    elementId: serviceNode.id,
                    label: 'Not found'
                });
            }
        });
    }

    private addServiceTypeMismatchMarkers(kuberService: k8s.V1Service, serviceNode: ServiceNode, markers: Marker[]): void {
        const serviceTypeNode = serviceNode.serviceTypeNode;
        if (serviceTypeNode) {
            if (getFullServiceTypeName(serviceTypeNode.name) !== kuberService.spec?.type) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The type: ${serviceTypeNode.name} of service: ${serviceNode.name} in model does not match with the type: ${kuberService.spec?.type} of service in cluster`,
                    elementId: serviceTypeNode.id,
                    label: 'Not match'
                });
            }
        }
    }

    private async validatePort(serviceNode: ServiceNode, modelPort: PortNode, kuberPorts: k8s.V1ServicePort[]): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberPort = kuberPorts.find(kuberPort => kuberPort.port === Number(modelPort.number));
        if (!kuberPort) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The port: ${modelPort.number} of service: ${serviceNode.name} in model does not found in cluster`,
                elementId: modelPort.id,
                label: 'Not found'
            });
        } else {
            const kuberPortName = kuberPort.name;
            if (kuberPortName && modelPort.name !== kuberPortName) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The name: ${modelPort.name} of port: ${modelPort.number} in model does not match with the name: ${kuberPortName} of port in cluster`,
                    elementId: modelPort.id,
                    label: 'Not match'
                });
            }
        }
        return markers;
    }

    private async validatePod(podNode: PodNode, kuberPods: k8s.V1Pod[]): Promise<Marker[]> {
        return [];
    }
}
