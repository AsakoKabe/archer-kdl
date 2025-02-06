/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GGraph, GModelFactory, ModelState } from '@eclipse-glsp/server';
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

    protected createGraph(): GGraph | undefined {
        const diagramRoot = this.modelState.kdlDiagram;
        if (!diagramRoot) {
            return;
        }
        const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
        diagramRoot.clusters.map(cluster => this.createClusterNode(cluster)).forEach(cluster => graphBuilder.add(cluster));
        return graphBuilder.build();
    }

    protected createClusterNode(cluster: ast.ClusterNode): GCompartment {
        const ingressNodes = cluster.ingresses
            .map(id => id.ref)
            .filter((e): e is ast.IngressNode => e !== undefined)
            .map(ingress => this.createIngressNode(ingress));

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
            .children()
            .addIngressNodes(ingressNodes)
            .addPodNodes(podNodes)
            .addServiceNodes(serviceNodes);
            
        if (cluster.dimensions) {
            builder
                .position({ x: cluster.dimensions.x, y: cluster.dimensions.y })
                .addLayoutOptions({ prefWidth: cluster.dimensions.width, prefHeight: cluster.dimensions.height });
        }

        return builder.build();
    }


    protected createIngressNode(ingress: ast.IngressNode): GCompartment {
        const builder = IngressNode.builder().type(ModelTypes.INGRESS).name(ingress.name).host(ingress.host).id(ingress.id);
        if (ingress.dimensions) {
            builder
                .position({ x: ingress.dimensions.x, y: ingress.dimensions.y })
                .addLayoutOptions({ prefWidth: ingress.dimensions.width, prefHeight: ingress.dimensions.height });
        }
        builder.children();

        return builder.build();
    }

    protected createPodNode(pod: ast.PodNode): GCompartment {
        const containerNodes = pod.containers
            .map(id => id.ref)
            .filter((e): e is ast.ContainerNode => e !== undefined)
            .map(container => this.createContainerNode(container));

        const portNodes = pod.ports
            .map(id => id.ref)
            .filter((e): e is ast.PortNode => e !== undefined)
            .map(port => this.createPortNode(port));

        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .name(pod.name)
            .id(pod.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addContainerNodes(containerNodes)
            .addPortNodes(portNodes);

        if (pod.dimensions) {
            builder
                .position({ x: pod.dimensions.x, y: pod.dimensions.y })
                .addLayoutOptions({ prefWidth: pod.dimensions.width, prefHeight: pod.dimensions.height });
        }
        return builder.build();
    }

    protected createServiceNode(service: ast.ServiceNode): GCompartment {
        const portNodes = service.ports
            .map(id => id.ref)
            .filter((e): e is ast.PortNode => e !== undefined)
            .map(port => this.createPortNode(port));

        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .name(service.name)
            .id(service.id)
            .addArgs(ArgsUtil.cornerRadius(50))
            .children()
            .addPortNodes(portNodes);

        if (service.dimensions) {
            builder
                .position({ x: service.dimensions.x, y: service.dimensions.y })
                .addLayoutOptions({ prefWidth: service.dimensions.width, prefHeight: service.dimensions.height });
        }
        return builder.build();
    }

    protected createContainerNode(container: ast.ContainerNode): GCompartment {
        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .name(container.name)
            .id(container.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (container.dimensions) {
            builder
                .position({ x: container.dimensions.x, y: container.dimensions.y })
                .addLayoutOptions({ prefWidth: container.dimensions.width, prefHeight: container.dimensions.height });
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
            .children();

        if (port.dimensions) {
            builder
                .position({ x: port.dimensions.x, y: port.dimensions.y })
                .addLayoutOptions({ prefWidth: port.dimensions.width, prefHeight: port.dimensions.height });
        }
        return builder.build();
    }
}
