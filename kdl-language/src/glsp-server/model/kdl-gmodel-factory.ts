import { ArgsUtil, GCompartment, GEdge, GGraph, GModelFactory } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ClusterNode } from '../graph/cluster-node.js';
import { ContainerNode } from '../graph/container-node.js';
import { IngressNode } from '../graph/ingress-node.js';
import { PodNode } from '../graph/pod-node.js';
import { PortNode } from '../graph/port-node.js';
import { ServiceNode } from '../graph/service-node.js';
import { ModelTypes } from '../utils/model-types.js';
import { KDLModelState } from './kdl-model-state.js';
import { Cluster, Container, Ingress, Link, Pod, Port, Service } from './kdl-model.js';

@injectable()
export class KDLGModelFactory implements GModelFactory {
    @inject(KDLModelState)
    protected modelState: KDLModelState;

    createModel(): void {
        const kdl = this.modelState.sourceModel;
        this.modelState.index.indexKDL(kdl);
        const childEdges = kdl.links.map(transition => this.createLinkEdge(transition));
        const clusterNodes = kdl.clusters.map(cluster => this.createClusterNode(cluster));
        const newRoot = GGraph.builder().id(kdl.id).addChildren(clusterNodes).addChildren(childEdges).build();
        this.modelState.updateRoot(newRoot);
    }

    protected createLinkEdge(link: Link): GEdge {
        return GEdge.builder()
            .id(link.id)
            .addCssClass('link')
            .sourceId(link.sourceId)
            .targetId(link.targetId)
            .addRoutingPoints(link.routingPoints)
            .build();
    }

    protected createClusterNode(cluster: Cluster): GCompartment {
        const ingressNodes = cluster.ingress_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(ingress => this.createIngressNode(ingress as Ingress));

        const podNodes = cluster.pod_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(pod => this.createPodNode(pod as Pod));

        const serviceNodes = cluster.service_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(service => this.createServiceNode(service as Service));

        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .position(cluster.position)
            .name(cluster.name)
            .id(cluster.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addIngressNodes(ingressNodes)
            .addPodNodes(podNodes)
            .addServiceNodes(serviceNodes);

        if (cluster.size) {
            builder.addLayoutOptions({ prefWidth: cluster.size.width, prefHeight: cluster.size.height });
        }

        return builder.build();
    }

    protected createIngressNode(ingress: Ingress): GCompartment {
        const builder = IngressNode.builder().type(ModelTypes.INGRESS).position(ingress.position).name(ingress.name).id(ingress.id);

        if (ingress.size) {
            builder.addLayoutOptions({ prefWidth: ingress.size.width, prefHeight: ingress.size.height });
        }
        if (ingress.host) {
            builder.host(ingress.host);
        }
        builder.children();

        return builder.build();
    }

    protected createPodNode(pod: Pod): GCompartment {
        const containerNodes = pod.container_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(container => this.createContainerNode(container as Container));

        const portNodes = pod.port_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(port => this.createPortNode(port as Port));

        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .position(pod.position)
            .name(pod.name)
            .id(pod.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addContainerNodes(containerNodes)
            .addPortNodes(portNodes);

        if (pod.size) {
            builder.addLayoutOptions({ prefWidth: pod.size.width, prefHeight: pod.size.height });
        }
        return builder.build();
    }

    protected createServiceNode(service: Service): GCompartment {
        const portNodes = service.port_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(port => this.createPortNode(port as Port));

        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .position(service.position)
            .name(service.name)
            .id(service.id)
            .addArgs(ArgsUtil.cornerRadius(50))
            .children()
            .addPortNodes(portNodes);

        if (service.size) {
            builder.addLayoutOptions({ prefWidth: service.size.width, prefHeight: service.size.height });
        }
        return builder.build();
    }

    protected createContainerNode(container: Container): GCompartment {
        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .position(container.position)
            .name(container.name)
            .id(container.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (container.size) {
            builder.addLayoutOptions({ prefWidth: container.size.width, prefHeight: container.size.height });
        }
        return builder.build();
    }

    protected createPortNode(port: Port): GCompartment {
        const builder = PortNode.builder()
            .type(ModelTypes.PORT)
            .position(port.position)
            .name(port.name)
            .number(port.number)
            .id(port.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (port.size) {
            builder.addLayoutOptions({ prefWidth: port.size.width, prefHeight: port.size.height });
        }
        return builder.build();
    }
}
