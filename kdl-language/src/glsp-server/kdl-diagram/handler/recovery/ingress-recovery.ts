/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { GLSPServerError } from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { KubeClient } from '../../../../kuber/client.js';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createIngressNode } from '../create/create-ingress-operation-handler.js';
import { IngressLinkRecovery } from './ingress-link-recovery.js';
import { Recover } from './recover.js';

export class IngressRecovery implements Recover<ast.NamespaceNode> {
    constructor(
        private kuberClient: KubeClient,
        private modelState: KDLModelState
    ) {}

    async recover(namespaceNode: ast.NamespaceNode): Promise<void> {
        try {
            const ingresses = await this.kuberClient.getIngresses(namespaceNode.name);
            for (const kuberIngress of ingresses) {
                await this.recoverIngress(namespaceNode, kuberIngress);
            }
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get ingresses');
        }
    }

    private async recoverIngress(namespaceNode: ast.NamespaceNode, kuberIngress: k8s.V1Ingress): Promise<void> {
        const ingressName = kuberIngress.metadata?.name || '';
        for (const rule of kuberIngress.spec?.rules || []) {
            await this.recoverHost(namespaceNode, ingressName, rule);
        }
    }

    private async recoverHost(namespaceNode: ast.NamespaceNode, ingressName: string, rule: k8s.V1IngressRule): Promise<void> {
        const ingress = createIngressNode(namespaceNode, ingressName, rule.host);
        namespaceNode.ingresses.push(ingress);
        await new IngressLinkRecovery(this.modelState).recover({ paths: rule.http?.paths, namespaceNode, ingress });
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, ingress);
    }
}
