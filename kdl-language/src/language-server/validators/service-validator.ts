import * as k8s from '@kubernetes/client-node';
import { ValidationAcceptor } from 'langium';
import { NamespaceNode, PortNode, ServiceNode } from '../generated/ast.js';
import type { KDLServices } from '../kdl-module.js';

export namespace ServiceValidator {
    export async function validateServices(namespaceNode: NamespaceNode, accept: ValidationAcceptor, services: KDLServices): Promise<void> {
        const kubeServices = await services.api.Kube.getServices(namespaceNode.name);
        addServiceNotFoundMarkers(kubeServices, namespaceNode, accept);
        for (const serviceNode of namespaceNode.services) {
            await validateService(serviceNode, kubeServices, accept);
        }
    }

    function addServiceNotFoundMarkers(kubeServices: k8s.V1Service[], namespaceNode: NamespaceNode, accept: ValidationAcceptor): void {
        kubeServices.forEach(clusterService => {
            const clusterServiceName = clusterService.metadata?.name;
            if (!clusterServiceName) {
                return;
            }
            if (!namespaceNode.services.map(serviceNode => serviceNode.name).includes(clusterServiceName)) {
                accept('warning', `Service "${clusterServiceName}" is not found in the model.`, {
                    node: namespaceNode,
                    keyword: 'services'
                });
            }
        });
    }

    async function validateService(serviceNode: ServiceNode, kubeServices: k8s.V1Service[], accept: ValidationAcceptor): Promise<void> {
        const kubeService = kubeServices.find(kubeService => kubeService.metadata?.name === serviceNode.name);
        if (!kubeService) {
            accept('warning', `Service "${serviceNode.name}" not found in cluster.`, { node: serviceNode, property: 'name' });
            return;
        }

        addServicePortNotFoundMarkers(kubeService, serviceNode, accept);
        for (const port of serviceNode.ports) {
            await validatePort(serviceNode, port, kubeService.spec?.ports || [], accept);
        }
        addServiceTypeMismatchMarkers(kubeService, serviceNode, accept);
    }

    function addServicePortNotFoundMarkers(kubeService: k8s.V1Service, serviceNode: ServiceNode, accept: ValidationAcceptor): void {
        (kubeService.spec?.ports || []).forEach(kubePort => {
            const kubePortNumber = kubePort.port;
            if (!serviceNode.ports.map(portNode => portNode.number? portNode.number.toString() : "").includes(kubePortNumber.toString())) {
                accept('warning', `The port: "${kubePortNumber}" of service: "${serviceNode.name}" in cluster does not found in model`, {
                    node: serviceNode,
                    keyword: 'ports'
                });
            }
        });
    }

    async function validatePort(
        serviceNode: ServiceNode,
        modelPort: PortNode,
        kubePorts: k8s.V1ServicePort[],
        accept: ValidationAcceptor
    ): Promise<void> {
        const kubePort = kubePorts.find(kubePort => kubePort.port === Number(modelPort.number));
        if (!kubePort) {
            accept('warning', `The port: "${modelPort.number}" of service: "${serviceNode.name}" in model does not found in cluster`, {
                node: modelPort,
                property: 'number'
            });
            return;
        }

        const kubePortName = kubePort.name;
        if (kubePortName && modelPort.name !== kubePortName) {
            accept(
                'warning',
                `The name: "${modelPort.name}" of port: "${modelPort.number}" in model does not match with the name: "${kubePortName}" of port in cluster`,
                {
                    node: modelPort,
                    property: 'name'
                }
            );
        }
    }

    function addServiceTypeMismatchMarkers(kubeService: k8s.V1Service, serviceNode: ServiceNode, accept: ValidationAcceptor): void {
        const serviceTypeNode = serviceNode.type;
        if (serviceTypeNode) {
            if (getFullServiceTypeName(serviceTypeNode.name) !== kubeService.spec?.type) {
                accept(
                    'warning',
                    `The type: "${serviceTypeNode.name}" of service: "${serviceNode.name}" in model does not match with the type: "${kubeService.spec?.type}" of service in cluster`,
                    {
                        node: serviceTypeNode,
                        property: 'name'
                    }
                );
            }
        } else {
            accept('warning', `The type of service: "${serviceNode.name}" in model is not defined`, {
                node: serviceNode,
                property: 'type'
            });
        }
    }

    export function getFullServiceTypeName(name: string): string {
        switch (name) {
            case 'CIP':
                return 'ClusterIP';
            case 'NP':
                return 'NodePort';
            case 'LB':
                return 'LoadBalancer';
            case 'EIP':
                return 'ExternalIP';
            default:
                return name;
        }
    }
}
