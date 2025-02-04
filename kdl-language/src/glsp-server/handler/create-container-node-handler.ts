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
import { ContainerNode, ContainerNodeBuilder } from '../graph/container-node.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Container, Pod } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreateContainerHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.CONTAINER];
    label = 'Container';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof ContainerNode) {
            const structComp = this.getContainerCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getContainerCompartment(container: ContainerNode): GCompartment | undefined {
        return container.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Container can't be outside pod");
        }
        const containerNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Pod.is(parent)) {
            parent.container_ids.push(containerNode.id);
        }
        this.modelState.sourceModel.containers.push(Container.createFromNode(containerNode));
        return containerNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): ContainerNodeBuilder {
        return (
            ContainerNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(ContainerNode).length)
                .addArgs(ArgsUtil.cornerRadius(5))
                .children()
                .nodeType(ModelTypes.CONTAINER)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
