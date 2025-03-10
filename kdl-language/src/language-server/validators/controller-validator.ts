import { ValidationAcceptor } from 'langium';
import { KuberController } from '../../kuber/client.js';
import { PodCardinality, PodController } from '../generated/ast.js';

export function addPodControllerMismatchMarkers(
    podController: PodController,
    kuberController: KuberController,
    accept: ValidationAcceptor
): void {
    if (getFullControllerName(podController.name) !== kuberController.kind) {
        accept(
            'warning',
            `Pod controller "${getFullControllerName(podController.name)}" does not match with cluster controller "${kuberController.kind}"`,
            {
                node: podController,
                property: 'name'
            }
        );
    }
}

export function addPodCardinalityMismatchMarkers(
    podCardinality: PodCardinality,
    kuberController: KuberController,
    accept: ValidationAcceptor
): void {
    if (kuberController.spec?.replicas?.toString() !== podCardinality.name) {
        accept(
            'warning',
            `Pod cardinality "${podCardinality.name}" does not match with cluster cardinality "${kuberController.spec?.replicas}"`,
            {
                node: podCardinality,
                property: 'name'
            }
        );
    }
}

function getFullControllerName(name: string): string {
    switch (name) {
        case 'D':
            return 'Deployment';
        case 'SS':
            return 'StatefulSet';
        case 'DS':
            return 'DaemonSet';
        case 'RS':
            return 'ReplicaSet';
        default:
            return name;
    }
}
