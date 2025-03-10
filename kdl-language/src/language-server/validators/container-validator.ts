import * as k8s from '@kubernetes/client-node';
import { ValidationAcceptor } from 'langium';
import { ContainerNode, PodNode } from '../generated/ast.js';

export async function validateContainer(
    podNode: PodNode,
    modelContainer: ContainerNode,
    kuberContainers: k8s.V1Container[],
    accept: ValidationAcceptor
): Promise<void> {
    const kuberContainer = kuberContainers.find(kuberContainer => kuberContainer.name === modelContainer.name);
    if (!kuberContainer) {
        accept('warning', `The container: "${modelContainer.name}" of pod: "${podNode.name}" in model does not found in cluster`, {
            node: modelContainer,
            property: 'name'
        });
        return;
    }
}

export function addPodContainerNotFoundMarkers(kuberContainers: k8s.V1Container[], podNode: PodNode, accept: ValidationAcceptor): void {
    kuberContainers.forEach(kuberContainer => {
        const kuberContainerName = kuberContainer.name;
        if (!podNode.containers.map(containerNode => containerNode.name).includes(kuberContainerName)) {
            if (podNode.containers.length) {
                accept('warning', `The container: "${kuberContainerName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'containers'
                });
            } else {
                accept('warning', `The container: "${kuberContainerName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'name'
                });
            }
        }
    });
}
