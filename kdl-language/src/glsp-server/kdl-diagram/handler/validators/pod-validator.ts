import { Marker, MarkerKind } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient, KuberController } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { PodNode } from '../../model/graph-extension/pod-node.js';
import * as k8s from '@kubernetes/client-node';
import { createErrorMessage, Validator } from './validator.js';
import { getFullControllerName } from '../create-pod-controller-operation-handler.js';
import { PodControllerNode } from '../../model/graph-extension/pod-controller-node.js';
import { PodCardinalityNode } from '../../model/graph-extension/pod-cardinality-node.js';

@injectable()
export class PodValidator implements Validator<NamespaceNode> {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    async validate(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberPods = await this.kuberClient.getPods(modelNamespace.name);
        this.addPodNotFoundMarkers(kuberPods, modelNamespace, markers);
        for (const podNode of modelNamespace.podNodes) {
            markers.push(...(await this.validatePod(podNode, kuberPods, modelNamespace.name)));
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

    private async validatePod(podNode: PodNode, kuberPods: k8s.V1Pod[], namespaceName: string): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberPod = kuberPods.find(kuberPod => kuberPod.metadata?.name === podNode.name);
        if (!kuberPod) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: createErrorMessage('pod', podNode.name, 'cluster'),
                elementId: podNode.id,
                label: 'Not found'
            });
            return markers;
        }

        const podController = podNode.controllerNode;
        const podCardinality = podNode.cardinalityNode;
        const kuberController = await this.kuberClient.getPodController(kuberPod, namespaceName);
        if (podController && kuberController) {
            this.addPodControllerMismatchMarkers(podController, kuberController, markers);
        }
        if (podCardinality && kuberController) {
            this.addPodCardinalityMismatchMarkers(podCardinality, kuberController, markers);
        }

        return markers;
    }

    private addPodControllerMismatchMarkers(podController: PodControllerNode, kuberController: KuberController, markers: Marker[]) {
        if (getFullControllerName(podController.name) !== kuberController.kind) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `Pod controller "${getFullControllerName(podController.name)}" does not match with cluster controller "${kuberController.kind}"`,
                elementId: podController.id,
                label: 'Not match'
            });
        }
    }

    private addPodCardinalityMismatchMarkers(podController: PodCardinalityNode, kuberController: KuberController, markers: Marker[]) {
        if (kuberController.spec?.replicas?.toString() !== podController.name) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `Pod cardinality "${podController.name}" does not match with cluster cardinality "${kuberController.spec?.replicas}"`,
                elementId: podController.id,
                label: 'Not match'
            });
        }
    }
}
