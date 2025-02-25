import { Marker, MarkerKind } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { PodNode } from '../../model/graph-extension/pod-node.js';
import * as k8s from '@kubernetes/client-node';
import { createErrorMessage, Validator } from './validator.js';

@injectable()
export class PodValidator implements Validator<NamespaceNode> {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    async validate(modelNamespace: NamespaceNode): Promise<Marker[]> {
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
                    description: createErrorMessage('pod', clusterPodName, 'model'),
                    elementId: modelNamespace.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validatePod(podNode: PodNode, kuberPods: k8s.V1Pod[]): Promise<Marker[]> {
        return [];
    }
}
