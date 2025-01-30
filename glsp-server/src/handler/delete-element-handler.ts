import {
    Command,
    DeleteElementOperation,
    GEdge,
    GNode,
    JsonOperationHandler,
    MaybePromise,
    remove,
    toTypeGuard
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { Cluster, Container, Ingress, KDLBaseElement, Link, Pod, Port, Service } from '../model/kdl-model';
import { KDLModelState } from '../model/kdl-model-state';

@injectable()
export class DeleteElementHandler extends JsonOperationHandler {
    readonly operationType = DeleteElementOperation.KIND;

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    override createCommand(operation: DeleteElementOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.elementIds.forEach(elementId => this.delete(elementId));
        });
    }

    protected delete(elementId: string): void {
        const index = this.modelState.index;
        const gModelElement = this.getGModelElementToDelete(elementId);
        const gModelElementId = gModelElement?.id ?? elementId;
        const gEdgeIds = this.getIncomingAndOutgoingEdgeIds(gModelElement);

        [...gEdgeIds, gModelElementId].map(id => index.findElement(id)).forEach(modelElement => this.deleteModelElement(modelElement));
    }

    private getGModelElementToDelete(elementId: string): GNode | GEdge | undefined {
        const index = this.modelState.index;
        const element = index.get(elementId);
        if (element instanceof GNode || element instanceof GEdge) {
            return element;
        }
        return index.findParentElement(elementId, toTypeGuard(GNode)) ?? index.findParentElement(elementId, toTypeGuard(GEdge));
    }

    protected getIncomingAndOutgoingEdgeIds(node: GNode | GEdge | undefined): string[] {
        return this.getIncomingAndOutgoingEdges(node).map(edge => edge.id);
    }

    protected getIncomingAndOutgoingEdges(node: GNode | GEdge | undefined): GEdge[] {
        if (node instanceof GNode) {
            return [...this.modelState.index.getIncomingEdges(node), ...this.modelState.index.getOutgoingEdges(node)];
        }
        return [];
    }

    private deleteLinks(element: KDLBaseElement): void {
        this.modelState.sourceModel.links = this.modelState.sourceModel.links.filter(
            link => (link.sourceId !== element.id) && (link.targetId !== element.id)
        );
    }

    private deleteIngress(ingress: Ingress): void {
        this.modelState.sourceModel.clusters.forEach(cluster => {
            cluster.ingress_ids = cluster.ingress_ids.filter(id => id !== ingress.id);
        });
        this.deleteLinks(ingress);
        remove(this.modelState.sourceModel.ingresses, ingress);
    }

    private deletePod(pod: Pod): void {
        pod.container_ids.concat(pod.port_ids).forEach(id => {
            this.deleteModelElement(this.modelState.index.findElement(id));
        });
        this.modelState.sourceModel.clusters.forEach(cluster => {
            cluster.pod_ids = cluster.pod_ids.filter(id => id !== pod.id);
        });
        remove(this.modelState.sourceModel.pods, pod);
    }

    private deleteService(service: Service): void {
        service.port_ids.forEach(id => {
            this.deleteModelElement(this.modelState.index.findElement(id));
        });
        this.modelState.sourceModel.clusters.forEach(cluster => {
            cluster.service_ids = cluster.service_ids.filter(id => id !== service.id);
        });
        this.deleteLinks(service);
        remove(this.modelState.sourceModel.services, service);
    }

    private deleteContainer(container: Container): void {
        this.modelState.sourceModel.pods.forEach(pod => {
            pod.container_ids = pod.container_ids.filter(id => id !== container.id);
        });
        remove(this.modelState.sourceModel.containers, container);
    }

    private deletePort(port: Port): void {
        this.modelState.sourceModel.pods.forEach(pod => {
            pod.port_ids = pod.port_ids.filter(id => id !== port.id);
        });
        this.modelState.sourceModel.services.forEach(service => {
            service.port_ids = service.port_ids.filter(id => id !== port.id);
        });
        this.deleteLinks(port);
        remove(this.modelState.sourceModel.ports, port);
    }

    private deleteCluster(cluster: Cluster): void {
        cluster.ingress_ids.concat(cluster.pod_ids, cluster.service_ids).forEach(id => {
            this.deleteModelElement(this.modelState.index.findElement(id));
        });
        remove(this.modelState.sourceModel.clusters, cluster);
    }

    private deleteModelElement(modelElement: KDLBaseElement | undefined): void {
        if (Cluster.is(modelElement)) {
            this.deleteCluster(modelElement);
        } else if (Ingress.is(modelElement)) {
            this.deleteIngress(modelElement);
        } else if (Pod.is(modelElement)) {
            this.deletePod(modelElement);
        } else if (Service.is(modelElement)) {
            this.deleteService(modelElement);
        } else if (Container.is(modelElement)) {
            this.deleteContainer(modelElement);
        } else if (Port.is(modelElement)) {
            this.deletePort(modelElement);
        } else if (Link.is(modelElement)) {
            remove(this.modelState.sourceModel.links, modelElement);
        }
    }
}
