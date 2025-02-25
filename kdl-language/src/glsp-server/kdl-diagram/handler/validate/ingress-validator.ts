import { Marker, MarkerKind } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { IngressNode } from '../../model/graph-extension/ingress-node.js';
import * as k8s from '@kubernetes/client-node';
import { createErrorMessage, Validator } from './validator.js';

@injectable()
export class IngressValidator implements Validator<NamespaceNode> {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    async validate(modelNamespace: NamespaceNode): Promise<Marker[]> {
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
                    description: createErrorMessage('ingress', kuberIngressName, 'model'),
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
                description: createErrorMessage('ingress', ingress.name, 'cluster'),
                elementId: ingress.id,
                label: 'Not found'
            });
            return markers;
        }
        
        const hosts = clusterIngress.spec?.rules?.map(rule => rule.host);
        if (!hosts || !hosts.includes(ingress.host)) {
            return [
                {
                    kind: MarkerKind.ERROR,
                    description: `Host "${ingress.host}" does not found in cluster ingress "${ingress.name}"`,
                    elementId: ingress.id,
                    label: 'Not found'
                }
            ];
        }

        return markers;
    }
}
