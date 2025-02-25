import { KuberClient } from '../../../../kuber/client.js';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createNamespaceNode } from '../create/create-namespace-operation-handler.js';
import { IngressRecovery } from './ingress-recovery.js';
import { PodRecovery } from './pod-recovery.js';
import { Recover } from './recover.js';
import { ServiceRecovery } from './service-recovery.js';

export type ClusterNamespaces = string[];

export class ClusterRecovery implements Recover<ClusterNamespaces> {
    constructor(
        private kuberClient: KuberClient,
        private modelState: KDLModelState
    ) {}

    async recover(clusterNamespaces: ClusterNamespaces): Promise<void> {
        const namespaces = this.createNamespaces(clusterNamespaces);
        await this.recoverResources(namespaces);
        await this.modelState.updateSourceModel(this.modelState.sourceModel);
    }

    private createNamespaces(clusterNamespaces: string[]): ast.NamespaceNode[] {
        const namespaces: ast.NamespaceNode[] = [];
        clusterNamespaces.map(clusterNamespace => {
            const namespace = createNamespaceNode(this.modelState.kdlDiagram, clusterNamespace);
            this.modelState.kdlDiagram.namespaces.push(namespace);
            namespaces.push(namespace);
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, namespace);
        });
        return namespaces;
    }

    private async recoverResources(namespaces: ast.NamespaceNode[]): Promise<void> {
        await Promise.all(namespaces.map(namespace => new PodRecovery(this.kuberClient, this.modelState).recover(namespace)));
        await Promise.all(namespaces.map(namespace => new ServiceRecovery(this.kuberClient, this.modelState).recover(namespace)));
        await Promise.all(namespaces.map(namespace => new IngressRecovery(this.kuberClient, this.modelState).recover(namespace)));
    }
}
