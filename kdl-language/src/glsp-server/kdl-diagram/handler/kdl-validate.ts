import { GGraph, GModelElement, Marker, MarkerKind, MarkersReason, ModelState, ModelValidator } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../kuber/client.js';
import { IngressNode } from '../model/graph-extension/ingress-node.js';
import { NamespaceNode } from '../model/graph-extension/namespace-node.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as k8s from '@kubernetes/client-node';
import { ServiceNode } from '../model/graph-extension/service-node.js';
import { getFullServiceTypeName } from './create-service-type-operation-handler.js';
import { PortNode } from '../model/graph-extension/port-node.js';

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
        const modelNamespaces = root.children.reduce((namespaces: NamespaceNode[], child) => {
            if (child instanceof NamespaceNode) {
                namespaces.push(child);
            }
            return namespaces;
        }, []);
        const modelNamespaceNames = modelNamespaces.map(namespace => namespace.name);
        const notFoundNamespaces = clusterNamespaces.filter(name => !modelNamespaceNames.includes(name));

        const markers: Marker[] = [];
        notFoundNamespaces.map(name => {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `${name} namespace is not found in the model, but it exists in the cluster`,
                elementId: root.id,
                label: 'Not found'
            });
        });

        modelNamespaces.forEach(namespace => {
            if (!clusterNamespaces.includes(namespace.name)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `"${namespace.name}" namespace does not found in cluster, but it exists in model`,
                    elementId: namespace.id,
                    label: 'Not found'
                });
            }
        });

        return markers;
    }

    private async validateNamespace(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        if (!clusterNamespaces.includes(modelNamespace.name)) {
            return [];
        }
        const markers: Marker[] = [];

        const kuberIngresses = await this.kuberClient.getIngresses(modelNamespace.name);
        for (const modelIngress of modelNamespace.ingressNodes) {
            kuberIngresses.forEach(kuberIngress => {
                const kuberIngressName = kuberIngress.metadata?.name;
                if (!kuberIngressName) {
                    return;
                }
                if (!modelNamespace.ingressNodes.map(ingressNode => ingressNode.name).includes(kuberIngressName)) {
                    markers.push({
                        kind: MarkerKind.ERROR,
                        description: '"' + kuberIngressName + '"' + ' ingress does not found in model, but it exists in cluster',
                        elementId: modelNamespace.id,
                        label: 'Not found'
                    });
                }
            });
            markers.push(...(await this.validateIngress(modelIngress, kuberIngresses)));
        }

        const clusterServices = await this.kuberClient.getServices(modelNamespace.name);
        for (const serviceNode of modelNamespace.serviceNodes) {
            clusterServices.forEach(clusterService => {
                const clusterServiceName = clusterService.metadata?.name;
                if (!clusterServiceName) {
                    return;
                }
                if (!modelNamespace.serviceNodes.map(serviceNode => serviceNode.name).includes(clusterServiceName)) {
                    markers.push({
                        kind: MarkerKind.ERROR,
                        description: '"' + clusterServiceName + '"' + ' service does not found in model, but it exists in cluster',
                        elementId: modelNamespace.id,
                        label: 'Not found'
                    });
                }
            });
            markers.push(...(await this.validateService(serviceNode, clusterServices)));
        }

        return markers;
    }

    private async validateIngress(ingress: IngressNode, clusterIngresses: k8s.V1Ingress[]): Promise<Marker[]> {
        const markers: Marker[] = [];

        const clusterIngress = clusterIngresses.find(clusterIngress => clusterIngress.metadata?.name === ingress.name);
        if (!clusterIngress) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: '"' + ingress.name + '"' + ' ingress does not found in cluster, but it exists in model',
                elementId: ingress.id,
                label: 'Not found'
            });
        } else {
            const hosts = clusterIngress.spec?.rules?.map(rule => rule.host);
            if (!hosts || !hosts.includes(ingress.host)) {
                return [
                    {
                        kind: MarkerKind.ERROR,
                        description: '"' + ingress.host + '"' + ' host does not found in cluster, but it exists in model',
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
                description: '"' + serviceNode.name + '"' + ' ingress does not found in cluster, but it exists in model',
                elementId: serviceNode.id,
                label: 'Not found'
            });
        } else {
            for (const port of serviceNode.portNodes) {
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
                markers.push(...(await this.validatePort(serviceNode, port, kuberService.spec?.ports || [])));
            }
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

        return markers;
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
}
