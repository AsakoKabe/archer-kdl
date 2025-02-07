/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GEdge, GGraph, GGraphBuilder, GModelFactory, ModelState, Point } from '@eclipse-glsp/server';
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

    protected createLinkEdge(sourceID: string, targetID: string): GEdge {
        return (
            GEdge.builder()
                .id(sourceID + '$' + targetID) // use to change routing points
                .addCssClass('link')
                .sourceId(sourceID)
                .targetId(targetID)
                // .addRoutingPoints(link.routingPoints)
                .build()
        );
    }

    protected createGraph(): GGraph | undefined {
        const diagramRoot = this.modelState.kdlDiagram;
        if (!diagramRoot) {
            return;
        }
        const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
        diagramRoot.clusters.map(cluster => this.createClusterNode(cluster, graphBuilder)).forEach(cluster => graphBuilder.add(cluster));

        diagramRoot.ingresses.map(ingress =>
            ingress.links.map(link => this.createLinkEdge(ingress.id, link.ref!.id)).forEach(link => graphBuilder.add(link))
        );
        diagramRoot.services.map(service =>
            service.links.map(link => this.createLinkEdge(service.id, link.ref!.id)).forEach(link => graphBuilder.add(link))
        );
        diagramRoot.containers.map(container =>
            container.links.map(link => this.createLinkEdge(container.id, link.ref!.id)).forEach(link => graphBuilder.add(link))
        );
        return graphBuilder.build();
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

        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .name(cluster.name)
            .id(cluster.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: cluster.dimensions ? cluster.dimensions.x : Point.ORIGIN.x,
                y: cluster.dimensions ? cluster.dimensions.y : Point.ORIGIN.y
            })
            .children()
            .addIngressNodes(ingressNodes)
            .addPodNodes(podNodes)
            .addServiceNodes(serviceNodes);

        if (cluster.dimensions?.width && cluster.dimensions?.height) {
            builder.addLayoutOptions({ prefWidth: cluster.dimensions.width, prefHeight: cluster.dimensions.height });
        }

        return builder.build();
    }

    protected createIngressNode(ingress: ast.IngressNode, graphBuilder: GGraphBuilder): GCompartment {
        const builder = IngressNode.builder()
            .type(ModelTypes.INGRESS)
            .name(ingress.name)
            .host(ingress.host)
            .id(ingress.id)
            .position({
                x: ingress.dimensions ? ingress.dimensions.x : Point.ORIGIN.x,
                y: ingress.dimensions ? ingress.dimensions.y : Point.ORIGIN.y
            });
        if (ingress.dimensions?.width && ingress.dimensions?.height) {
            builder.addLayoutOptions({
                prefWidth: ingress.dimensions.width,
                prefHeight: ingress.dimensions.height
            });
        }
        builder.children();

        return builder.build();
    }

    protected createPodNode(pod: ast.PodNode): GCompartment {
        const containerNodes = pod.containers
            .map(id => id.ref)
            .filter((e): e is ast.ContainerNode => e !== undefined)
            .map(container => this.createContainerNode(container));

        const portNodes = pod.ports.map(port => this.createPortNode(port));

        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .name(pod.name)
            .id(pod.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: pod.dimensions ? pod.dimensions.x : Point.ORIGIN.x,
                y: pod.dimensions ? pod.dimensions.y : Point.ORIGIN.y
            })
            .children()
            .addContainerNodes(containerNodes)
            .addPortNodes(portNodes);

        if (pod.dimensions?.width && pod.dimensions?.height) {
            builder.addLayoutOptions({
                prefWidth: pod.dimensions.width,
                prefHeight: pod.dimensions.height
            });
        }
        return builder.build();
    }

    protected createServiceNode(service: ast.ServiceNode): GCompartment {
        const portNodes = service.ports.map(port => this.createPortNode(port));

        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .name(service.name)
            .id(service.id)
            .addArgs(ArgsUtil.cornerRadius(50))
            .position({
                x: service.dimensions ? service.dimensions.x : Point.ORIGIN.x,
                y: service.dimensions ? service.dimensions.y : Point.ORIGIN.y
            })
            .children()
            .addPortNodes(portNodes);

        if (service.dimensions?.width && service.dimensions?.height) {
            builder.addLayoutOptions({
                prefWidth: service.dimensions.width,
                prefHeight: service.dimensions.height
            });
        }
        return builder.build();
    }

    protected createContainerNode(container: ast.ContainerNode): GCompartment {
        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .name(container.name)
            .id(container.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: container.dimensions ? container.dimensions.x : Point.ORIGIN.x,
                y: container.dimensions ? container.dimensions.y : Point.ORIGIN.y
            })
            .children();

        if (container.dimensions?.width && container.dimensions?.height) {
            builder.addLayoutOptions({
                prefWidth: container.dimensions.width,
                prefHeight: container.dimensions.height
            });
        }
        return builder.build();
    }

    protected createPortNode(port: ast.PortNode): GCompartment {
        const builder = PortNode.builder()
            .type(ModelTypes.PORT)
            .name(port.name)
            .number(port.number.toString())
            .id(port.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .position({
                x: port.dimensions ? port.dimensions.x : Point.ORIGIN.x,
                y: port.dimensions ? port.dimensions.y : Point.ORIGIN.y
            })
            .children();

        if (port.dimensions?.height && port.dimensions?.width) {
            builder.addLayoutOptions({
                prefWidth: port.dimensions.width,
                prefHeight: port.dimensions.height
            });
        }
        return builder.build();
    }
}
