/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import * as k8s from '@kubernetes/client-node';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addEdgeAttribute } from '../../model/utils.js';
import { Recover } from './recover.js';

export type IngressLinkRecoveryParams = {
    paths: k8s.V1HTTPIngressPath[] | undefined;
    namespaceNode: ast.NamespaceNode;
    ingress: ast.IngressNode;
};
export class IngressLinkRecovery implements Recover<IngressLinkRecoveryParams> {
    constructor(private modelState: KDLModelState) {}

    async recover({ paths, namespaceNode, ingress }: IngressLinkRecoveryParams): Promise<void> {
        if (!paths) {
            return;
        }
        for (const path of paths) {
            const targetService = this.findTargetService(namespaceNode, path);
            if (!targetService) {
                continue;
            }
            this.recoverIngressLinks(ingress, targetService, path);
        }
    }

    private findTargetService(namespaceNode: ast.NamespaceNode, path: k8s.V1HTTPIngressPath): ast.ServiceNode | undefined {
        const serviceName = path.backend?.service?.name;
        return namespaceNode.services
            .filter((service): service is ast.ServiceNode => service !== undefined && service.name === serviceName)
            .at(0);
    }

    private recoverIngressLinks(ingress: ast.IngressNode, targetService: ast.ServiceNode, path: k8s.V1HTTPIngressPath): void {
        const servicePortNumber = path.backend?.service?.port?.number;
        const servicePortName = path.backend?.service?.port?.name;

        const targetPorts = targetService.ports.filter(
            (port): port is ast.PortNode => port !== undefined && (port.name === servicePortName || port.number === servicePortNumber)
        );

        targetPorts.map(port => {
            ingress.links.push({ ref: port, $refText: this.modelState.idProvider.getLocalId(port) || port.id });
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addEdgeAttribute(
                this.modelState.kdlDiagram.diagram,
                this.modelState.idProvider.getLocalId(ingress) || ingress.id,
                this.modelState.idProvider.getLocalId(port) || port.id,
                ingress,
                port
            );
        });
    }
}
