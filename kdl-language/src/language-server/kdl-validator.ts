/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as k8s from '@kubernetes/client-node';
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { Diagnostic } from 'vscode-languageserver-protocol';
import { KuberController } from '../kuber/client.js';
import {
    ContainerNode,
    IngressNode,
    isKDLDiagram,
    KDLAstType,
    KDLDiagram,
    NamespaceNode,
    PodCardinality,
    PodController,
    PodNode,
    PortNode,
    ServiceNode,
    VolumeNode
} from './generated/ast.js';
import type { KDLServices } from './kdl-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './kdl-naming.js';
import { ExtractedVolume, VolumeExtractor } from '../kuber/volume-extractor.js';

export namespace KDLIssueCodes {
    export const FilenameNotMatching = 'filename-not-matching';
}

export interface FilenameNotMatchingDiagnostic extends Diagnostic {
    data: {
        code: typeof KDLIssueCodes.FilenameNotMatching;
    };
}

export namespace FilenameNotMatchingDiagnostic {
    export function is(diagnostic: Diagnostic): diagnostic is FilenameNotMatchingDiagnostic {
        return diagnostic.data?.code === KDLIssueCodes.FilenameNotMatching;
    }
}

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: KDLServices): void {
    const registry = services.validation.ValidationRegistry;
    // const validator = services.validation.CrossModelValidator;
    const kuberValidator = services.validation.KubeValidator;

    const checks: ValidationChecks<KDLAstType> = {
        // AstNode: validator.checkNode,
        NamespaceNode: kuberValidator.checkNamespaceNode,
        KDLDiagram: kuberValidator.checkKdlDiagram
    };
    // registry.register(checks, validator);
    registry.register(checks, kuberValidator);
}

/**
 * Implementation of custom validations.
 */
export class KDLValidator {
    constructor(protected services: KDLServices) {}

    checkNode(node: AstNode, accept: ValidationAcceptor): void {
        this.checkUniqueGlobalId(node, accept);
        this.checkUniqueNodeId(node, accept);
    }

    protected checkUniqueGlobalId(node: AstNode, accept: ValidationAcceptor): void {
        if (!this.isExportedGlobally(node)) {
            return;
        }
        const globalId = this.services.references.IdProvider.getGlobalId(node);
        if (!globalId) {
            accept('error', 'Missing required id field', { node, property: ID_PROPERTY });
            return;
        }
        const allElements = Array.from(this.services.shared.workspace.IndexManager.allElements());
        const duplicates = allElements.filter(description => description.name === globalId);
        if (duplicates.length > 1) {
            accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
        }
    }

    protected isExportedGlobally(node: AstNode): boolean {
        // we export anything with an id from entities and relationships and all root nodes, see CrossModelScopeComputation
        return isKDLDiagram(node);
    }

    protected checkUniqueNodeId(node: AstNode, accept: ValidationAcceptor): void {
        if (isKDLDiagram(node)) {
            this.markDuplicateIds(
                // TODO: FIX ME
                Array.of<IdentifiableAstNode>(),
                // ...node.model.clusters,
                // ...node.model.ingresses,
                // ...node.model.services,
                // ...node.model.services.flatMap(s => s.ports),
                // ...node.model.pods,
                // ...node.model.pods.flatMap(p => p.ports),
                // ...node.model.containers,
                // ...node.diagram.edgeAttributes
                accept
            );
        }
    }

    protected markDuplicateIds(nodes: IdentifiableAstNode[], accept: ValidationAcceptor): void {
        const knownIds: string[] = [];
        for (const node of nodes) {
            if (node.id && knownIds.includes(node.id)) {
                accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
            } else if (node.id) {
                knownIds.push(node.id);
            }
        }
    }
}

export class KubeValidator {
    constructor(protected services: KDLServices) {}

    async checkNamespaceNode(namespaceNode: NamespaceNode, accept: ValidationAcceptor): Promise<void> {
        const kubeNamespaces = await this.services.api.Kube.getNamespaces();
        if (!kubeNamespaces.includes(namespaceNode.name)) {
            accept('warning', `Namespace "${namespaceNode.name}" is not found in Kubernetes cluster.`, {
                node: namespaceNode,
                keyword: 'name'
            });
        }

        await IngressValidator.validateIngresses(namespaceNode, accept, this.services);
        await ServiceValidator.validateServices(namespaceNode, accept, this.services);
        await PodValidator.validate(namespaceNode, accept, this.services);
    }

    async checkKdlDiagram(kdlDiagram: KDLDiagram, accept: ValidationAcceptor): Promise<void> {
        const kubeNamespaces = await this.services.api.Kube.getNamespaces();
        const modelNamespaces = kdlDiagram.namespaces.map(ns => ns.name);
        for (const kubeNamespace of kubeNamespaces) {
            if (!modelNamespaces.includes(kubeNamespace)) {
                accept('warning', `Namespace "${kubeNamespace}" is not found in KDL model.`, {
                    node: kdlDiagram,
                    keyword: 'namespaces'
                });
            }
        }
    }
}

namespace PodValidator {
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

namespace IngressValidator {
    export async function validateIngresses(
        namespaceNode: NamespaceNode,
        accept: ValidationAcceptor,
        services: KDLServices
    ): Promise<void> {
        const kubeIngresses = await services.api.Kube.getIngresses(namespaceNode.name);
        addIngressNotFoundMarkers(kubeIngresses, namespaceNode, accept);
        namespaceNode.ingresses.map(ingress => validateIngress(ingress, kubeIngresses, accept));
    }

    export function addIngressNotFoundMarkers(
        kubeIngresses: k8s.V1Ingress[],
        modelNamespace: NamespaceNode,
        accept: ValidationAcceptor
    ): void {
        kubeIngresses.forEach(kubeIngress => {
            const kubeIngressName = kubeIngress.metadata?.name;
            if (!kubeIngressName) {
                return;
            }
            if (!modelNamespace.ingresses.map(ingressNode => ingressNode.name).includes(kubeIngressName)) {
                accept('warning', `Ingress "${kubeIngressName}" is not found in the model.`, {
                    node: modelNamespace,
                    keyword: 'ingresses'
                });
            }
        });
    }

    export function validateIngress(ingress: IngressNode, clusterIngresses: k8s.V1Ingress[], accept: ValidationAcceptor): void {
        const clusterIngress = clusterIngresses.find(clusterIngress => clusterIngress.metadata?.name === ingress.name);
        if (!clusterIngress) {
            accept('warning', `Ingress "${ingress.name}" not found in cluster.`, { node: ingress, property: 'name' });
            return;
        }

        const hosts = clusterIngress.spec?.rules?.map(rule => rule.host);
        if (!hosts || !hosts.includes(ingress.host)) {
            accept('warning', `Host "${ingress.host}" not found in cluster ingress "${ingress.name}".`, {
                node: ingress,
                property: 'host'
            });
        }
    }
}

namespace ServiceValidator {
    export async function validateServices(namespaceNode: NamespaceNode, accept: ValidationAcceptor, services: KDLServices): Promise<void> {
        const kubeServices = await services.api.Kube.getServices(namespaceNode.name);
        addServiceNotFoundMarkers(kubeServices, namespaceNode, accept);
        for (const serviceNode of namespaceNode.services) {
            await validateService(serviceNode, kubeServices, accept);
        }
    }

    function addServiceNotFoundMarkers(kubeServices: k8s.V1Service[], namespaceNode: NamespaceNode, accept: ValidationAcceptor): void {
        kubeServices.forEach(clusterService => {
            const clusterServiceName = clusterService.metadata?.name;
            if (!clusterServiceName) {
                return;
            }
            if (!namespaceNode.services.map(serviceNode => serviceNode.name).includes(clusterServiceName)) {
                accept('warning', `Service "${clusterServiceName}" is not found in the model.`, {
                    node: namespaceNode,
                    keyword: 'services'
                });
            }
        });
    }

    async function validateService(serviceNode: ServiceNode, kubeServices: k8s.V1Service[], accept: ValidationAcceptor): Promise<void> {
        const kubeService = kubeServices.find(kubeService => kubeService.metadata?.name === serviceNode.name);
        if (!kubeService) {
            accept('warning', `Service "${serviceNode.name}" not found in cluster.`, { node: serviceNode, property: 'name' });
            return;
        }

        addServicePortNotFoundMarkers(kubeService, serviceNode, accept);
        for (const port of serviceNode.ports) {
            await validatePort(serviceNode, port, kubeService.spec?.ports || [], accept);
        }
        addServiceTypeMismatchMarkers(kubeService, serviceNode, accept);
    }

    function addServicePortNotFoundMarkers(kubeService: k8s.V1Service, serviceNode: ServiceNode, accept: ValidationAcceptor): void {
        (kubeService.spec?.ports || []).forEach(kubePort => {
            const kubePortNumber = kubePort.port;
            if (!serviceNode.ports.map(portNode => portNode.number.toString()).includes(kubePortNumber.toString())) {
                accept('warning', `The port: "${kubePortNumber}" of service: "${serviceNode.name}" in cluster does not found in model`, {
                    node: serviceNode,
                    keyword: 'ports'
                });
            }
        });
    }

    async function validatePort(
        serviceNode: ServiceNode,
        modelPort: PortNode,
        kubePorts: k8s.V1ServicePort[],
        accept: ValidationAcceptor
    ): Promise<void> {
        const kubePort = kubePorts.find(kubePort => kubePort.port === Number(modelPort.number));
        if (!kubePort) {
            accept('warning', `The port: "${modelPort.number}" of service: "${serviceNode.name}" in model does not found in cluster`, {
                node: modelPort,
                property: 'number'
            });
            return;
        }

        const kubePortName = kubePort.name;
        if (kubePortName && modelPort.name !== kubePortName) {
            accept(
                'warning',
                `The name: "${modelPort.name}" of port: "${modelPort.number}" in model does not match with the name: "${kubePortName}" of port in cluster`,
                {
                    node: modelPort,
                    property: 'name'
                }
            );
        }
    }

    function addServiceTypeMismatchMarkers(kubeService: k8s.V1Service, serviceNode: ServiceNode, accept: ValidationAcceptor): void {
        const serviceTypeNode = serviceNode.type;
        if (serviceTypeNode) {
            if (getFullServiceTypeName(serviceTypeNode.name) !== kubeService.spec?.type) {
                accept(
                    'warning',
                    `The type: "${serviceTypeNode.name}" of service: "${serviceNode.name}" in model does not match with the type: "${kubeService.spec?.type}" of service in cluster`,
                    {
                        node: serviceTypeNode,
                        property: 'name'
                    }
                );
            }
        } else {
            accept('warning', `The type of service: "${serviceNode.name}" in model is not defined`, {
                node: serviceNode,
                property: 'type'
            });
        }
    }

    export function getFullServiceTypeName(name: string): string {
        switch (name) {
            case 'CIP':
                return 'ClusterIP';
            case 'NP':
                return 'NodePort';
            case 'LB':
                return 'LoadBalancer';
            case 'EIP':
                return 'ExternalIP';
            default:
                return name;
        }
    }
}
