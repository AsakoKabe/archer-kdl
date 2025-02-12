/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GEdge, GGraph, GGraphBuilder, GModelFactory, ModelState } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { ClusterNode } from './graph-extension/cluster-node.js';
import { KDLModelState } from './kdl-state.js';
import { IngressNode } from './graph-extension/ingress-node.js';
import { PodNode } from './graph-extension/pod-node.js';
import { ServiceNode } from './graph-extension/service-node.js';
import { ContainerNode } from './graph-extension/container-node.js';
import { PortNode } from './graph-extension/port-node.js';
import { createEdgeID, createNodeAttribute, KDLNode } from './graph-extension/utils.js';

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

    protected createGraph(): GGraph | undefined {
        const diagramRoot = this.modelState.kdlDiagram;
        if (!diagramRoot.model || !diagramRoot.diagram) {
            return;
        }
        const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
        this.addClustersToGraph(diagramRoot, graphBuilder);
        this.addLinksToGraph(diagramRoot, graphBuilder);     
        return graphBuilder.build();
    }

    protected addClustersToGraph(diagramRoot: ast.KDLDiagram, graphBuilder: GGraphBuilder): void {
        diagramRoot.model.clusters
            .map(cluster => this.createClusterNode(cluster, graphBuilder))
            .forEach(cluster => graphBuilder.add(cluster));
    }

    protected addLinksToGraph(diagramRoot: ast.KDLDiagram, graphBuilder: GGraphBuilder): void {
        const links = this.collectLinks(diagramRoot);
        links.map(link => this.createEdge(link)).forEach(edge => graphBuilder.add(edge));
    }

    protected collectLinks(diagramRoot: ast.KDLDiagram): { source: ast.SourceNodeType; target: ast.TargetNodeType }[] {
        return [
            ...diagramRoot.model.ingresses.flatMap(ingress => ingress.links.map(link => ({ source: ingress, target: link.ref! }))),
            ...diagramRoot.model.services.flatMap(service => service.links.map(link => ({ source: service, target: link.ref! }))),
            ...diagramRoot.model.containers.flatMap(container => container.links.map(link => ({ source: container, target: link.ref! })))
        ]
    }

    protected createEdge(link: { source: ast.SourceNodeType; target: ast.TargetNodeType }): GEdge {
        const sourceID = this.modelState.idProvider.getLocalId(link.source)!;
        const targetID = this.modelState.idProvider.getLocalId(link.target)!;
        const edgeAttribute = this.findOrCreateEdgeAttribute(link.source, sourceID, link.target, targetID);
        return (
            GEdge.builder()
                .id(this.modelState.idProvider.getLocalId(edgeAttribute)!)
                .addCssClass('link')
                .sourceId(sourceID)
                .targetId(targetID)
                // .addRoutingPoints(edgeAttribute.points)
                .build()
        );
    }

    protected findOrCreateEdgeAttribute(source: ast.SourceNodeType, sourceID: string, target: ast.TargetNodeType, targetID: string): ast.EdgeAttribute {
        const edgeAttributes = this.modelState.kdlDiagram.diagram.edgeAttributes;
        let edgeAttribute = edgeAttributes.find(edgeAttribute => edgeAttribute.id === createEdgeID(sourceID, targetID));
        if (!edgeAttribute) {
            edgeAttribute = {
                $type: ast.EdgeAttribute,
                $container: this.modelState.kdlDiagram.diagram,
                id: createEdgeID(sourceID, targetID),
                sourceID: { $refText: sourceID, ref: source },
                targetID: { $refText: targetID, ref: target }
            };
            // this.modelState.kdlDiagram.diagram.edgeAttributes.push(edgeAttribute);
        }
        return edgeAttribute;
    }

    protected findOrCreateNodeAttribute(node: KDLNode): ast.NodeAttribute {
        const nodeAttributes = this.modelState.kdlDiagram.diagram.nodeAttributes;
        let nodeAttribute = nodeAttributes.find(nodeAttribute => nodeAttribute.nodeID.$refText === this.modelState.idProvider.getLocalId(node));
        if (!nodeAttribute) {
            nodeAttribute = createNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, node);
            // this.modelState.kdlDiagram.diagram.nodeAttributes.push(nodeAttribute);
        }
        return nodeAttribute;
    }

    protected createClusterNode(cluster: ast.ClusterNode, graphBuilder: GGraphBuilder): GCompartment {
        const ingressNodes = cluster.ingresses
            .map(id => id.ref)
            .filter((e): e is ast.IngressNode => e !== undefined)
            .map(ingress => this.createIngressNode(ingress, graphBuilder));

        const podNodes = cluster.pods
            .map(id => id.ref)
            .filter((e): e is ast.PodNode => e !== undefined)
            .map(pod => this.createPodNode(pod));

        const serviceNodes = cluster.services
            .map(id => id.ref)
            .filter((e): e is ast.ServiceNode => e !== undefined)
            .map(service => this.createServiceNode(service));

        const clusterAttributes = this.findOrCreateNodeAttribute(cluster);
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

    protected createIngressNode(ingress: ast.IngressNode, graphBuilder: GGraphBuilder): GCompartment {
        const ingressAttributes = this.findOrCreateNodeAttribute(ingress);
        const builder = IngressNode.builder()
            .type(ModelTypes.INGRESS)
            .name(ingress.name)
            .host(ingress.host)
            .id(this.modelState.idProvider.getLocalId(ingress)!)
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

    protected createPodNode(pod: ast.PodNode): GCompartment {
        const containerNodes = pod.containers
            .map(id => id.ref)
            .filter((e): e is ast.ContainerNode => e !== undefined)
            .map(container => this.createContainerNode(container));

        const portNodes = pod.ports.map(port => this.createPortNode(port));

        const podAttributes = this.findOrCreateNodeAttribute(pod);
        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .name(pod.name)
            .id(this.modelState.idProvider.getLocalId(pod)!)
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
            .addPortNodes(portNodes);

        return builder.build();
    }

    protected createServiceNode(service: ast.ServiceNode): GCompartment {
        const portNodes = service.ports.map(port => this.createPortNode(port));
        const serviceAttributes = this.findOrCreateNodeAttribute(service);
        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .name(service.name)
            .id(this.modelState.idProvider.getLocalId(service)!)
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

        return builder.build();
    }

    protected createContainerNode(container: ast.ContainerNode): GCompartment {
        const containerAttributes = this.findOrCreateNodeAttribute(container);

        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .name(container.name)
            .id(this.modelState.idProvider.getLocalId(container)!)
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

    protected createPortNode(port: ast.PortNode): GCompartment {
        const portAttributes = this.findOrCreateNodeAttribute(port);

        const builder = PortNode.builder()
            .type(ModelTypes.PORT)
            .name(port.name)
            .number(port.number.toString())
            .id(this.modelState.idProvider.getLocalId(port)!)
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
