import { Marker, MarkerKind } from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { PortNode } from '../../model/graph-extension/port-node.js';
import { ServiceNode } from '../../model/graph-extension/service-node.js';
import { getFullServiceTypeName } from '../create/create-service-type-operation-handler.js';
import { createErrorMessage, Validator } from './validator.js';

@injectable()
export class ServiceValidator implements Validator<NamespaceNode> {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    async validate(modelNamespace: NamespaceNode): Promise<Marker[]> {
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
                    description: createErrorMessage('service', clusterServiceName, 'model'),
                    elementId: modelNamespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateService(serviceNode: ServiceNode, kuberServices: k8s.V1Service[]): Promise<Marker[]> {
        const markers: Marker[] = [];

        const kuberService = kuberServices.find(kuberService => kuberService.metadata?.name === serviceNode.name);
        if (!kuberService) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: createErrorMessage('service', serviceNode.name, 'cluster'),
                elementId: serviceNode.id,
                label: 'Not found'
            });
            return markers;
        }

        this.addServicePortNotFoundMarkers(kuberService, serviceNode, markers);
        for (const port of serviceNode.portNodes) {
            markers.push(...(await this.validatePort(serviceNode, port, kuberService.spec?.ports || [])));
        }
        this.addServiceTypeMismatchMarkers(kuberService, serviceNode, markers);

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
            return markers;
        }

        const kuberPortName = kuberPort.name;
        if (kuberPortName && modelPort.name !== kuberPortName) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The name: ${modelPort.name} of port: ${modelPort.number} in model does not match with the name: ${kuberPortName} of port in cluster`,
                elementId: modelPort.id,
                label: 'Not match'
            });
        }
        return markers;
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
}
