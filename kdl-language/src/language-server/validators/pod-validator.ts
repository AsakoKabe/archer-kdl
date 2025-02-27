import * as k8s from '@kubernetes/client-node';
import { ValidationAcceptor } from 'langium';
import { KuberController } from '../../kuber/client.js';
import { ExtractedVolume, VolumeExtractor } from '../../kuber/volume-extractor.js';
import { ContainerNode, NamespaceNode, PodCardinality, PodController, PodNode, PortNode, VolumeNode } from '../generated/ast.js';
import type { KDLServices } from '../kdl-module.js';

export namespace PodValidator {
    export async function validate(modelNamespace: NamespaceNode, accept: ValidationAcceptor, services: KDLServices): Promise<void> {
        const kuberPods = await services.api.Kube.getPods(modelNamespace.name);
        addPodNotFoundMarkers(kuberPods, modelNamespace, accept);
        for (const podNode of modelNamespace.pods) {
            await validatePod(podNode, kuberPods, accept, services);
        }
    }

    function addPodNotFoundMarkers(kuberPods: k8s.V1Pod[], modelNamespace: NamespaceNode, accept: ValidationAcceptor): void {
        kuberPods.forEach(clusterPod => {
            const clusterPodName = clusterPod.metadata?.name;
            if (!clusterPodName) {
                return;
            }
            if (!modelNamespace.pods.map(podNode => podNode.name).includes(clusterPodName)) {
                accept('warning', `Pod "${clusterPodName}" is not found in the model.`, {
                    node: modelNamespace,
                    keyword: 'pods'
                });
            }
        });
    }

    async function validatePod(podNode: PodNode, kuberPods: k8s.V1Pod[], accept: ValidationAcceptor, services: KDLServices): Promise<void> {
        const kuberPod = kuberPods.find(kuberPod => kuberPod.metadata?.name === podNode.name);
        if (!kuberPod) {
            accept('warning', `Pod "${podNode.name}" not found in cluster.`, { node: podNode, property: 'name' });
            return;
        }

        const podPorts = podNode.ports;
        const kuberPorts = getKuberPorts(kuberPod);
        addPodPortNotFoundMarkers(kuberPorts, podNode, accept);
        for (const portNode of podPorts) {
            await validatePort(podNode, portNode, kuberPorts, accept);
        }

        const podContainers = podNode.containers;
        const kuberContainers = kuberPod.spec?.containers || [];
        addPodContainerNotFoundMarkers(kuberContainers, podNode, accept);
        for (const containerNode of podContainers) {
            await validateContainer(podNode, containerNode, kuberContainers, accept);
        }

        const podController = podNode.controller;
        const podCardinality = podNode.cardinality;
        const kuberController = await services.api.Kube.getPodController(kuberPod, podNode.$container.name);
        if (kuberController) {
            if (podController) {
                addPodControllerMismatchMarkers(podController, kuberController, accept);
            } else {
                accept('warning', `Pod controller "${kuberController.kind}" exists in cluster but not in model.`, {
                    node: podNode,
                    keyword: 'name'
                });
            }
        }
        if (kuberController) {
            if (podCardinality) {
                addPodCardinalityMismatchMarkers(podCardinality, kuberController, accept);
            } else {
                accept('warning', `Pod cardinality "${kuberController.spec?.replicas}" exists in cluster but not in model.`, {
                    node: podNode,
                    keyword: 'name'
                });
            }
        }

        const podVolumes = podNode.volumes;
        const kuberVolumes = VolumeExtractor.extractVolumes(kuberPod, kuberContainers);
        addPodVolumeNotFoundMarkers(kuberVolumes, podNode, accept);
        for (const volumeNode of podVolumes) {
            await validateVolume(podNode, volumeNode, kuberVolumes, accept);
        }
    }

    function getKuberPorts(kuberPod: k8s.V1Pod): k8s.V1ContainerPort[] {
        return (kuberPod.spec?.containers?.flatMap(container => container.ports) || []).filter(
            (port): port is k8s.V1ContainerPort => port !== undefined
        );
    }

    function addPodPortNotFoundMarkers(kuberPorts: k8s.V1ContainerPort[], podNode: PodNode, accept: ValidationAcceptor): void {
        kuberPorts.forEach(kuberPort => {
            const kuberPortNumber = kuberPort.containerPort;
            if (!podNode.ports.map(portNode => portNode.number.toString()).includes(kuberPortNumber.toString())) {
                accept('warning', `The port: "${kuberPortNumber}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'ports'
                });
            }
        });
    }

    async function validatePort(
        podNode: PodNode,
        modelPort: PortNode,
        kuberPorts: k8s.V1ContainerPort[],
        accept: ValidationAcceptor
    ): Promise<void> {
        const kuberPort = kuberPorts.find(kuberPort => kuberPort.containerPort === Number(modelPort.number));
        if (!kuberPort) {
            accept('warning', `The port: "${modelPort.number}" of pod: "${podNode.name}" in model does not found in cluster`, {
                node: modelPort,
                property: 'number'
            });
            return;
        }

        const kuberPortName = kuberPort.name;
        if (kuberPortName && modelPort.name !== kuberPortName) {
            accept(
                'warning',
                `The name: "${modelPort.name}" of port: "${modelPort.number}" in model does not match with the name: "${kuberPortName}" of port in cluster`,
                {
                    node: modelPort,
                    property: 'name'
                }
            );
        }
    }

    function addPodContainerNotFoundMarkers(kuberContainers: k8s.V1Container[], podNode: PodNode, accept: ValidationAcceptor): void {
        kuberContainers.forEach(kuberContainer => {
            const kuberContainerName = kuberContainer.name;
            if (!podNode.containers.map(containerNode => containerNode.name).includes(kuberContainerName)) {
                accept('warning', `The container: "${kuberContainerName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'containers'
                });
            }
        });
    }

    async function validateContainer(
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

    function addPodControllerMismatchMarkers(
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

    function addPodCardinalityMismatchMarkers(
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

    function addPodVolumeNotFoundMarkers(kuberVolumes: Set<ExtractedVolume>, podNode: PodNode, accept: ValidationAcceptor): void {
        kuberVolumes.forEach(kuberVolume => {
            const kuberVolumeName = kuberVolume.name;
            if (!podNode.volumes.map(volumeNode => volumeNode.name).includes(kuberVolumeName)) {
                accept('warning', `The volume: "${kuberVolumeName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'volumes'
                });
            }
        });
    }

    async function validateVolume(
        podNode: PodNode,
        modelVolume: VolumeNode,
        kuberVolumes: Set<ExtractedVolume>,
        accept: ValidationAcceptor
    ): Promise<void> {
        let kuberVolume: ExtractedVolume | undefined;
        for (const volume of kuberVolumes) {
            if (volume.name === modelVolume.name) {
                kuberVolume = volume;
                break;
            }
        }
        if (!kuberVolume) {
            accept('warning', `The volume: "${modelVolume.name}" of pod: "${podNode.name}" in model does not found in cluster`, {
                node: modelVolume,
                property: 'name'
            });
            return;
        }

        if (kuberVolume.type !== modelVolume.type) {
            accept(
                'warning',
                `The type: "${modelVolume.type}" of volume: "${modelVolume.name}" in model does not match with the type: "${kuberVolume.type}" of volume in cluster`,
                {
                    node: modelVolume,
                    property: 'type'
                }
            );
        }
    }

    export function getFullControllerName(name: string): string {
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
}
