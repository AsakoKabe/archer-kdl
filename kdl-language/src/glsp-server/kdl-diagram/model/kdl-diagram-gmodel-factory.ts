/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GEdge, GGraph, GGraphBuilder, GModelFactory, ModelState } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { ClusterNode } from './graph-extension/cluster-node.js';
import { ContainerNode } from './graph-extension/container-node.js';
import { IngressNode } from './graph-extension/ingress-node.js';
import { PodCardinalityNode } from './graph-extension/pod-cardinality-node.js';
import { PodControllerNode } from './graph-extension/pod-controller-node.js';
import { PodNode } from './graph-extension/pod-node.js';
import { PortNode } from './graph-extension/port-node.js';
import { ServiceNode } from './graph-extension/service-node.js';
import { ServiceTypeNode } from './graph-extension/service-type-node.js';
import { VolumeNode } from './graph-extension/volume-node.js';
import { KDLModelState } from './kdl-state.js';
import { createEdgeID, createNodeAttribute } from './utils.js';

/**
 * Custom factory that translates the semantic diagram root from Langium to a GLSP graph.
 * Each semantic element in the diagram will be translated to a GModel element on the GLSP side.
 * The GLSP client will later use the GModel to render the SVG elements based on their type.
 */
@injectable()
export class KDLDiagramGModelFactory implements GModelFactory {
    @inject(ModelState) protected readonly modelState!: KDLModelState;

    createModel(): void {
        const newRoot = this.createGraph();
        if (newRoot) {
            // update GLSP root element in state so it can be used in any follow-up actions/commands
            this.modelState.updateRoot(newRoot);
        }
    }

    protected createGraph(): GGraph {
        const kdlDiagram = this.modelState.kdlDiagram;
        if (!kdlDiagram.diagram) {
            return GGraph.builder().id(this.modelState.semanticUri).build();
        }

        const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
        this.addClustersToGraph(kdlDiagram, graphBuilder);
        kdlDiagram.clusters.forEach(cluster => this.addLinksToGraph(cluster, graphBuilder));
        return graphBuilder.build();
    }

    protected addClustersToGraph(diagramRoot: ast.KDLDiagram, graphBuilder: GGraphBuilder): void {
        diagramRoot.clusters
            .map(cluster => this.createClusterNode(cluster, graphBuilder))
            .forEach(cluster => {
                if (cluster) graphBuilder.add(cluster);
            });
    }

    protected addLinksToGraph(cluster: ast.ClusterNode, graphBuilder: GGraphBuilder): void {
        const links = this.collectLinks(cluster);
        links
            .map(link => this.createEdge(link))
            .forEach(edge => {
                if (edge) {
                    graphBuilder.add(edge);
                }
            });
    }

    protected collectLinks(cluster: ast.ClusterNode): { source: ast.SourceNodeType; target: ast.TargetNodeType }[] {
        const links = [
            ...cluster.ingresses.flatMap(ingress => ingress.links.map(link => ({ source: ingress, target: link.ref }))),
            ...cluster.services.flatMap(service => service.links.map(link => ({ source: service, target: link.ref }))),
            ...cluster.pods.flatMap(pod =>
                pod.containers.flatMap(container => container.links.map(link => ({ source: container, target: link.ref })))
            )
        ].filter(link => link.target !== undefined) as { source: ast.SourceNodeType; target: ast.TargetNodeType }[];
        return links;
    }

    protected createEdge(link: { source: ast.SourceNodeType; target: ast.TargetNodeType }): GEdge | null {
        const sourceID = this.modelState.idProvider.getLocalId(link.source) || link.source.id;
        const targetID = this.modelState.idProvider.getLocalId(link.target) || link.target.id;
        const edgeAttribute = this.findOrCreateEdgeAttribute(link.source, sourceID, link.target, targetID);
        if (!edgeAttribute) {
            return null;
        }
        const builder = GEdge.builder()
            .id(this.modelState.idProvider.getLocalId(edgeAttribute) || edgeAttribute.id)
            .addCssClass('link')
            .sourceId(sourceID)
            .targetId(targetID);

        if (edgeAttribute.points) {
            builder.addRoutingPoints(edgeAttribute.points.map(p => ({ x: p.x, y: p.y })));
        }
        return builder.build();
    }

    protected findOrCreateEdgeAttribute(
        source: ast.SourceNodeType,
        sourceID: string,
        target: ast.TargetNodeType,
        targetID: string
    ): ast.EdgeAttribute | null {
        if (!this.modelState.kdlDiagram.diagram) {
            return null;
        }
        let edgeAttribute = this.modelState.kdlDiagram.diagram.edgeAttributes.find(
            edgeAttribute => edgeAttribute.id === createEdgeID(sourceID, targetID)
        );
        if (!edgeAttribute) {
            edgeAttribute = {
                $type: ast.EdgeAttribute,
                $container: this.modelState.kdlDiagram.diagram,
                id: createEdgeID(sourceID, targetID),
                sourceID: { $refText: sourceID, ref: source },
                targetID: { $refText: targetID, ref: target },
                points: []
            };
            // this.modelState.kdlDiagram.diagram.edgeAttributes.push(edgeAttribute);
        }
        return edgeAttribute;
    }

    protected findOrCreateNodeAttribute(node: ast.NodeType): ast.NodeAttribute | null {
        if (!this.modelState.kdlDiagram.diagram) {
            return null;
        }
        const nodeAttributes = this.modelState.kdlDiagram.diagram.nodeAttributes;
        let nodeAttribute = nodeAttributes.find(
            nodeAttribute => nodeAttribute.nodeID.$refText === this.modelState.idProvider.getLocalId(node)
        );
        if (!nodeAttribute) {
            nodeAttribute = createNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, node);
            // this.modelState.kdlDiagram.diagram.nodeAttributes.push(nodeAttribute);
        }
        return nodeAttribute;
    }

    protected createClusterNode(cluster: ast.ClusterNode, graphBuilder: GGraphBuilder): GCompartment | null {
        const ingressNodes = cluster.ingresses
            .filter((e): e is ast.IngressNode => e !== undefined)
            .map(ingress => this.createIngressNode(ingress, graphBuilder))
            .filter(i => i !== null) as GCompartment[];

        const podNodes = cluster.pods
            .filter((e): e is ast.PodNode => e !== undefined)
            .map(pod => this.createPodNode(pod))
            .filter(p => p !== null) as GCompartment[];

        const serviceNodes = cluster.services
            .filter((e): e is ast.ServiceNode => e !== undefined)
            .map(service => this.createServiceNode(service))
            .filter(s => s !== null) as GCompartment[];

        const clusterAttributes = this.findOrCreateNodeAttribute(cluster);
        if (!clusterAttributes) {
            return null;
        }
        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .name(cluster.name)
            .id(this.modelState.idProvider.getLocalId(cluster)!)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: clusterAttributes.dimensions.x,
                y: clusterAttributes.dimensions.y
            })
            .addLayoutOptions({ prefWidth: clusterAttributes.dimensions.width, prefHeight: clusterAttributes.dimensions.height })
            .children()
            .addIngressNodes(ingressNodes)
            .addPodNodes(podNodes)
            .addServiceNodes(serviceNodes);

        return builder.build();
    }

    protected createIngressNode(ingress: ast.IngressNode, graphBuilder: GGraphBuilder): GCompartment | null {
        const ingressAttributes = this.findOrCreateNodeAttribute(ingress);
        if (!ingressAttributes) {
            return null;
        }
        const builder = IngressNode.builder()
            .type(ModelTypes.INGRESS)
            .name(ingress.name)
            .host(ingress.host)
            .id(this.modelState.idProvider.getLocalId(ingress) || ingress.id)
            .position({
                x: ingressAttributes.dimensions.x,
                y: ingressAttributes.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: ingressAttributes.dimensions.width,
                prefHeight: ingressAttributes.dimensions.height
            });
        builder.children();

        return builder.build();
    }

    protected createPodNode(pod: ast.PodNode): GCompartment | null {
        const containerNodes = pod.containers
            .filter((e): e is ast.ContainerNode => e !== undefined)
            .map(container => this.createContainerNode(container))
            .filter(c => c !== null) as GCompartment[];

        const portNodes = pod.ports.map(port => this.createPortNode(port)).filter(p => p !== null) as GCompartment[];
        const volumeNodes = pod.volumes.map(volume => this.createVolumeNode(volume)).filter(v => v !== null) as GCompartment[];

        const podAttributes = this.findOrCreateNodeAttribute(pod);
        if (!podAttributes) {
            return null;
        }
        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .name(pod.name)
            .id(this.modelState.idProvider.getLocalId(pod) || pod.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: podAttributes.dimensions.x,
                y: podAttributes.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: podAttributes.dimensions.width,
                prefHeight: podAttributes.dimensions.height
            })
            .children()
            .addContainerNodes(containerNodes)
            .addPortNodes(portNodes)
            .addVolumeNodes(volumeNodes);

        if (pod.controller) {
            const controllerNode = this.createPodControllerNode(pod.controller);
            if (controllerNode) builder.addControllerNode(controllerNode);
        }
        if (pod.cardinality) {
            const cardinalityNode = this.createPodCardinalityNode(pod.cardinality);
            if (cardinalityNode) builder.addCardinalityNode(cardinalityNode);
        }

        return builder.build();
    }

    private createPodControllerNode(controller: ast.PodController): GCompartment | null {
        const controllerAttribute = this.findOrCreateNodeAttribute(controller);
        if (!controllerAttribute) {
            return null;
        }
        const builder = PodControllerNode.builder()
            .type(ModelTypes.POD_CONTROLLER)
            .name(controller.name)
            .id(this.modelState.idProvider.getLocalId(controller) || controller.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: controllerAttribute.dimensions.x,
                y: controllerAttribute.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: controllerAttribute.dimensions.width,
                prefHeight: controllerAttribute.dimensions.height
            })
            .children();
        return builder.build();
    }

    private createVolumeNode(volume: ast.VolumeNode): GCompartment | null {
        const volumeAttr = this.findOrCreateNodeAttribute(volume);
        if (!volumeAttr) {
            return null;
        }
        const builder = VolumeNode.builder()
            .type(ModelTypes.VOLUME)
            .name(volume.name)
            .volumeType(volume.type)
            .id(this.modelState.idProvider.getLocalId(volume) || volume.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: volumeAttr.dimensions.x,
                y: volumeAttr.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: volumeAttr.dimensions.width,
                prefHeight: volumeAttr.dimensions.height
            })
            .children();
        return builder.build();
    }

    private createPodCardinalityNode(cardinality: ast.PodCardinality): GCompartment | null {
        const controllerAttribute = this.findOrCreateNodeAttribute(cardinality);
        if (!controllerAttribute) {
            return null;
        }
        const builder = PodCardinalityNode.builder()
            .type(ModelTypes.POD_CARDINALITY)
            .name(cardinality.name)
            .id(this.modelState.idProvider.getLocalId(cardinality) || cardinality.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: controllerAttribute.dimensions.x,
                y: controllerAttribute.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: controllerAttribute.dimensions.width,
                prefHeight: controllerAttribute.dimensions.height
            })
            .children();
        return builder.build();
    }

    protected createServiceNode(service: ast.ServiceNode): GCompartment | null {
        const portNodes = service.ports.map(port => this.createPortNode(port)).filter(p => p !== null) as GCompartment[];
        const serviceID = this.modelState.idProvider.getLocalId(service) || service.id;
        const serviceAttributes = this.findOrCreateNodeAttribute(service);
        if (!serviceAttributes) {
            return null;
        }
        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .name(service.name)
            .id(serviceID)
            .addArgs(ArgsUtil.cornerRadius(50))
            .position({
                x: serviceAttributes.dimensions.x,
                y: serviceAttributes.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: serviceAttributes.dimensions.width,
                prefHeight: serviceAttributes.dimensions.height
            })
            .children()
            .addPortNodes(portNodes);

        if (service.type) {
            const serviceTypeNode = this.createServiceTypeNode(service.type);
            if (serviceTypeNode) builder.addTypeNode(serviceTypeNode);
        }

        return builder.build();
    }

    private createServiceTypeNode(typeNode: ast.ServiceTypeNode): GCompartment | null {
        const serviceTypeAttribute = this.findOrCreateNodeAttribute(typeNode);
        if (!serviceTypeAttribute) {
            return null; 
        }

        const builder = ServiceTypeNode.builder()
            .type(ModelTypes.SERVICE_TYPE)
            .name(typeNode.name)
            .id(this.modelState.idProvider.getLocalId(typeNode) || typeNode.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: serviceTypeAttribute.dimensions.x,
                y: serviceTypeAttribute.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: serviceTypeAttribute.dimensions.width,
                prefHeight: serviceTypeAttribute.dimensions.height
            })
            .children();
        return builder.build();
    }

    protected createContainerNode(container: ast.ContainerNode): GCompartment | null {
        const containerAttributes = this.findOrCreateNodeAttribute(container);
        if (!containerAttributes) {
            return null;
        }
        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .name(container.name)
            .id(this.modelState.idProvider.getLocalId(container) || container.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: containerAttributes.dimensions.x,
                y: containerAttributes.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: containerAttributes.dimensions.width,
                prefHeight: containerAttributes.dimensions.height
            })
            .children();
        return builder.build();
    }

    protected createPortNode(port: ast.PortNode): GCompartment | null {
        const portAttributes = this.findOrCreateNodeAttribute(port);
        if (!portAttributes) {
            return null;
        }
        const builder = PortNode.builder()
            .type(ModelTypes.PORT)
            .name(port.name)
            .number(port.number.toString())
            .id(this.modelState.idProvider.getLocalId(port) || port.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: portAttributes.dimensions.x,
                y: portAttributes.dimensions.y
            })
            .addLayoutOptions({
                prefWidth: portAttributes.dimensions.width,
                prefHeight: portAttributes.dimensions.height
            })
            .children();
        return builder.build();
    }
}
