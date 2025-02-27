import { Marker, MarkerKind } from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { inject, injectable } from 'inversify';
import { KubeClient, KuberController } from '../../../../kuber/client.js';
import { ContainerNode } from '../../model/graph-extension/container-node.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { PodCardinalityNode } from '../../model/graph-extension/pod-cardinality-node.js';
import { PodControllerNode } from '../../model/graph-extension/pod-controller-node.js';
import { PodNode } from '../../model/graph-extension/pod-node.js';
import { PortNode } from '../../model/graph-extension/port-node.js';
import { VolumeNode } from '../../model/graph-extension/volume-node.js';
import { getFullControllerName } from '../create/create-pod-controller-operation-handler.js';
import { ExtractedVolume, VolumeExtractor } from '../recovery/volume-extractor.js';
import { createErrorMessage, Validator } from './validator.js';

@injectable()
export class PodValidator implements Validator<NamespaceNode> {
    @inject(KubeClient)
    protected kuberClient: KubeClient;

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
        if (kuberController) {
            if (podController){
                this.addPodControllerMismatchMarkers(podController, kuberController, markers);
            } else {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `Pod controller "${kuberController.kind}" does not found in model`,
                    elementId: podNode.id,
                    label: 'Not found'
                });
            }
        }
        if (kuberController) {
            if (podCardinality){
                this.addPodCardinalityMismatchMarkers(podCardinality, kuberController, markers);
            } else {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `Pod cardinality "${kuberController.spec?.replicas}" does not found in model`,
                    elementId: podNode.id,
                    label: 'Not found'
                });
            }
        }

        const podPorts = podNode.portNodes;
        const kuberPorts = this.getKuberPorts(kuberPod);
        this.addPodPortNotFoundMarkers(kuberPorts, podNode, markers);
        for (const portNode of podPorts) {
            markers.push(...(await this.validatePort(podNode, portNode, kuberPorts)));
        }

        const podContainers = podNode.containerNodes;
        const kuberContainers = kuberPod.spec?.containers || [];
        this.addPodContainerNotFoundMarkers(kuberContainers, podNode, markers);
        for (const containerNode of podContainers) {
            markers.push(...(await this.validateContainer(podNode, containerNode, kuberContainers)));
        }

        const podVolumes = podNode.volumeNodes;
        const kuberVolumes = VolumeExtractor.extractVolumes(kuberPod, kuberContainers);
        this.addPodVolumeNotFoundMarkers(kuberVolumes, podNode, markers);
        for (const volumeNode of podVolumes) {
            markers.push(...(await this.validateVolume(podNode, volumeNode, kuberVolumes)));
        }

        return markers;
    }

    private getKuberPorts(kuberPod: k8s.V1Pod): k8s.V1ContainerPort[] {
        return (kuberPod.spec?.containers?.flatMap(container => container.ports) || []).filter(
            (port): port is k8s.V1ContainerPort => port !== undefined
        );
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

    private addPodPortNotFoundMarkers(kuberPorts: k8s.V1ContainerPort[], podNode: PodNode, markers: Marker[]): void {
        kuberPorts.forEach(kuberPort => {
            const kuberPortNumber = kuberPort.containerPort;
            if (!podNode.portNodes.map(portNode => portNode.number.toString()).includes(kuberPortNumber.toString())) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The port: ${kuberPortNumber} of pod: ${podNode.name} in cluster does not found in model`,
                    elementId: podNode.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validatePort(podNode: PodNode, modelPort: PortNode, kuberPorts: k8s.V1ContainerPort[]): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberPort = kuberPorts.find(kuberPort => kuberPort.containerPort === Number(modelPort.number));
        if (!kuberPort) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The port: ${modelPort.number} of pod: ${podNode.name} in model does not found in cluster`,
                elementId: modelPort.id,
                label: 'Not found'
            });
            return markers;
        }

        const kuberPortName = kuberPort.name;
        if (kuberPortName && modelPort.name !== kuberPortName) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The name: ${modelPort.name} of port: ${modelPort.number} in model does not match with the name: ${kuberPortName} of port in cluster`,
                elementId: modelPort.id,
                label: 'Not match'
            });
        }
        return markers;
    }

    private addPodContainerNotFoundMarkers(kuberContainers: k8s.V1Container[], podNode: PodNode, markers: Marker[]): void {
        kuberContainers.forEach(kuberContainer => {
            const kuberContainerName = kuberContainer.name;
            if (!podNode.containerNodes.map(containerNode => containerNode.name).includes(kuberContainerName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The container: ${kuberContainerName} of pod: ${podNode.name} in cluster does not found in model`,
                    elementId: podNode.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateContainer(
        podNode: PodNode,
        modelContainer: ContainerNode,
        kuberContainers: k8s.V1Container[]
    ): Promise<Marker[]> {
        const markers: Marker[] = [];
        const kuberContainer = kuberContainers.find(kuberContainer => kuberContainer.name === modelContainer.name);
        if (!kuberContainer) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The container: ${modelContainer.name} of pod: ${podNode.name} in model does not found in cluster`,
                elementId: modelContainer.id,
                label: 'Not found'
            });
            return markers;
        }

        return markers;
    }

    private addPodVolumeNotFoundMarkers(kuberVolumes: Set<ExtractedVolume>, podNode: PodNode, markers: Marker[]): void {
        kuberVolumes.forEach(kuberVolume => {
            const kuberVolumeName = kuberVolume.name;
            if (!podNode.volumeNodes.map(volumeNode => volumeNode.name).includes(kuberVolumeName)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: `The volume: ${kuberVolumeName} of pod: ${podNode.name} in cluster does not found in model`,
                    elementId: podNode.id,
                    label: 'Not found'
                });
            }
        });
    }

    private async validateVolume(podNode: PodNode, modelVolume: VolumeNode, kuberVolumes: Set<ExtractedVolume>): Promise<Marker[]> {
        const markers: Marker[] = [];
        let kuberVolume: ExtractedVolume | undefined;
        for (const volume of kuberVolumes) {
            if (volume.name === modelVolume.name) {
                kuberVolume = volume;
                break;
            }
        }
        if (!kuberVolume) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The volume: ${modelVolume.name} of pod: ${podNode.name} in model does not found in cluster`,
                elementId: modelVolume.id,
                label: 'Not found'
            });
            return markers;
        }

        if (kuberVolume.type !== modelVolume.volumeType) {
            markers.push({
                kind: MarkerKind.ERROR,
                description: `The type: ${modelVolume.volumeType} of volume: ${modelVolume.name} in model does not match with the type: ${kuberVolume.type} of volume in cluster`,
                elementId: modelVolume.id,
                label: 'Type mismatch'
            });
        }

        return markers;
    }
}
