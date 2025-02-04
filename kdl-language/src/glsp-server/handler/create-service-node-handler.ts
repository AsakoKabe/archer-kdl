import {
    ArgsUtil,
    CreateNodeOperation,
    GCompartment,
    GhostElement,
    GLSPServerError,
    GModelCreateNodeOperationHandler,
    GModelElement,
    GNode,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ServiceNode, ServiceNodeBuilder } from '../graph/service-node.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Cluster, Service } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreateServiceHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.SERVICE];
    label = 'Service';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof ServiceNode) {
            const structComp = this.getServiceCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getServiceCompartment(service: ServiceNode): GCompartment | undefined {
        return service.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Service can't be outside cluster");
        }
        const serviceNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Cluster.is(parent)) {
            parent.service_ids.push(serviceNode.id);
        }
        this.modelState.sourceModel.services.push(Service.createFromNode(serviceNode));
        return serviceNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): ServiceNodeBuilder {
        return (
            ServiceNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(ServiceNode).length)
                .addArgs(ArgsUtil.cornerRadius(50))
                .children()
                .nodeType(ModelTypes.SERVICE)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
