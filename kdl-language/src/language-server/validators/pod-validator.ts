import * as k8s from '@kubernetes/client-node';
import { ValidationAcceptor } from 'langium';
import { VolumeExtractor } from '../../kuber/volume-extractor.js';
import { NamespaceNode, PodNode, PortNode } from '../generated/ast.js';
import type { KDLServices } from '../kdl-module.js';
import { addPodContainerNotFoundMarkers, validateContainer } from './container-validator.js';
import { addPodCardinalityMismatchMarkers, addPodControllerMismatchMarkers } from './controller-validator.js';
import { addPodVolumeNotFoundMarkers, validateVolume } from './volume-validator.js';

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
                if (modelNamespace.pods.length) {
                    accept('warning', `Pod "${clusterPodName}" is not found in the model.`, {
                        node: modelNamespace,
                        keyword: 'pods'
                    });
                } else {
                    accept('warning', `Pod "${clusterPodName}" is not found in the model.`, {
                        node: modelNamespace,
                        keyword: 'name'
                    });
                }
            }
        });
    }

    async function validatePod(podNode: PodNode, kuberPods: k8s.V1Pod[], accept: ValidationAcceptor, services: KDLServices): Promise<void> {
        const kuberPod = kuberPods.find(kuberPod => kuberPod.metadata?.name === podNode.name);
        if (!kuberPod) {
            accept('warning', `Pod "${podNode.name}" not found in cluster.`, { node: podNode, property: 'name' });
            return;
        }

        await validatePodPorts(podNode, kuberPod, accept);
        await validatePodContainers(podNode, kuberPod, accept);
        await validatePodControllerAndCardinality(podNode, kuberPod, accept, services);
        await validatePodVolumes(podNode, kuberPod, accept);
    }

    async function validatePodPorts(podNode: PodNode, kuberPod: k8s.V1Pod, accept: ValidationAcceptor): Promise<void> {
        const podPorts = podNode.ports;
        const kuberPorts = getKuberPorts(kuberPod);
        addPodPortNotFoundMarkers(kuberPorts, podNode, accept);
        for (const portNode of podPorts) {
            await validatePort(podNode, portNode, kuberPorts, accept);
        }
    }

    async function validatePodContainers(podNode: PodNode, kuberPod: k8s.V1Pod, accept: ValidationAcceptor): Promise<void> {
        const podContainers = podNode.containers;
        const kuberContainers = kuberPod.spec?.containers || [];
        addPodContainerNotFoundMarkers(kuberContainers, podNode, accept);
        for (const containerNode of podContainers) {
            await validateContainer(podNode, containerNode, kuberContainers, accept);
        }
    }

    async function validatePodControllerAndCardinality(
        podNode: PodNode,
        kuberPod: k8s.V1Pod,
        accept: ValidationAcceptor,
        services: KDLServices
    ): Promise<void> {
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
    }

    async function validatePodVolumes(podNode: PodNode, kuberPod: k8s.V1Pod, accept: ValidationAcceptor): Promise<void> {
        const podVolumes = podNode.volumes;
        const kuberVolumes = VolumeExtractor.extractVolumes(kuberPod, kuberPod.spec?.containers || []);
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
            if (!podNode.ports.map(portNode => (portNode.number ? portNode.number.toString() : '')).includes(kuberPortNumber.toString())) {
                if (podNode.ports.length) {
                    accept('warning', `The port: "${kuberPortNumber}" of pod: "${podNode.name}" in cluster does not found in model`, {
                        node: podNode,
                        keyword: 'ports'
                    });
                } else {
                    accept(
                        'warning',
                        `The port: "${kuberPort.containerPort}" of pod: "${podNode.name}" in cluster does not found in model`,
                        {
                            node: podNode,
                            keyword: 'name'
                        }
                    );
                }
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
}
