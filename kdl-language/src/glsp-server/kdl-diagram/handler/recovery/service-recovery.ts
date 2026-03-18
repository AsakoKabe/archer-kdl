/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { GLSPServerError } from '@eclipse-glsp/server';
import { KubeClient } from '../../../../kuber/client.js';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute, BaseDim } from '../../model/utils.js';
import { createServiceNode } from '../create/create-service-operation-handler.js';
import { PortRecovery } from './port-recovery.js';
import { Recover } from './recover.js';
import { ServiceLinkRecovery } from './service-link-recovery.js';

export class ServiceRecovery implements Recover<ast.NamespaceNode> {
    constructor(
        private kuberClient: KubeClient,
        private modelState: KDLModelState
    ) {}

    async recover(namespace: ast.NamespaceNode): Promise<void> {
        try {
            const serviceList = await this.kuberClient.getServices(namespace.name);
            for (const kuberService of serviceList) {
                const service = createServiceNode(namespace, kuberService.metadata?.name, kuberService.spec?.type);
                namespace.services.push(service);

                if (kuberService.spec?.ports) {
                    await this.recoverServicePortsAndLinks(namespace, service, kuberService);
                    this.addServiceNodeAttributes(service);
                }
            }
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    private async recoverServicePortsAndLinks(namespace: ast.NamespaceNode, service: any, kuberService: any): Promise<void> {
        new PortRecovery(this.modelState).recoverServicePorts(service, kuberService.spec.ports);
        await new ServiceLinkRecovery(this.kuberClient, this.modelState).recover({
            namespace: namespace.name,
            namespaceNode: namespace,
            service: service,
            kuberService: kuberService,
            kuberPorts: kuberService.spec.ports
        });
    }

    private addServiceNodeAttributes(service: any): void {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, service, undefined, BaseDim.Service);
        if (service.type) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, service.type);
        }
    }
}
