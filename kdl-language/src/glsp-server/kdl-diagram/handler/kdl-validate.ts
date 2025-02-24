import { GGraph, GModelElement, Marker, MarkerKind, MarkersReason, ModelState, ModelValidator } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../kuber/client.js';
import { IngressNode } from '../model/graph-extension/ingress-node.js';
import { NamespaceNode } from '../model/graph-extension/namespace-node.js';
import { KDLModelState } from '../model/kdl-state.js';

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
        } else if (element instanceof IngressNode) {
            return await this.validateIngress(element);
        }

        return [];
    }

    private async validateRoot(root: GGraph): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        const modelNamespaces = root.children
            .map(child => {
                if (child instanceof NamespaceNode) return child;
                return undefined;
            })
            .filter((name): name is NamespaceNode => name !== undefined);
        const notFoundNamespaces = clusterNamespaces.filter(name => !modelNamespaces.map(namespace => namespace.name).includes(name));

        const markers: Marker[] = [];
        notFoundNamespaces.forEach(name => {
            markers.push({
                kind: MarkerKind.ERROR,
                description: "\"" + name + "\"" + ' namespace not found in model, but it is in the cluster',
                elementId: root.id,
                label: 'Not found'
            });
        });

        modelNamespaces.forEach(namespace => {
            if (!clusterNamespaces.includes(namespace.name)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: "\"" + namespace.name + "\"" + ' namespace does not found in cluster, but it is in the model',
                    elementId: namespace.id,
                    label: 'Not found'
                });
            }
        });

        return markers;
    }

    private async validateNamespace(namespace: NamespaceNode): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        if (!clusterNamespaces.includes(namespace.name)) {
            return [];
        }
        const clusterIngresses = (await this.kuberClient.getIngresses(namespace.name)).items;

        const markers: Marker[] = [];
        clusterIngresses.forEach(clusterIngress => {
            const clusterIngressName = clusterIngress.metadata?.name;
            if (!clusterIngressName) {
                return;
            }
            if (!namespace.ingressNodes.map(ingressNode => ingressNode.name).includes(clusterIngressName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: "\"" + clusterIngressName + "\"" + ' ingress not found in model, but it is in the cluster',
                    elementId: namespace.id,
                    label: 'Not found'
                });
            }
        });

        namespace.ingressNodes.forEach(ingressNode => {
            if (!clusterIngresses.find(clusterIngress => clusterIngress.metadata?.name === ingressNode.name)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: "\"" + ingressNode.name + "\"" + ' ingress does not found in cluster, but it is in the model',
                    elementId: ingressNode.id,
                    label: 'Not found'
                });
            }
        });

        return markers;
    }

    private async validateIngress(ingress: IngressNode): Promise<Marker[]> {
        return [];
    }
}
