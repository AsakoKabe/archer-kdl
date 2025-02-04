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
import { PortNode, PortNodeBuilder } from '../graph/port-node.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Pod, Port, Service } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreatePortHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.PORT];
    label = 'Port';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof PortNode) {
            const structComp = this.getPortCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getPortCompartment(port: PortNode): GCompartment | undefined {
        return port.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const portNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Pod.is(parent) || Service.is(parent)) {
            parent.port_ids.push(portNode.id);
        }
        this.modelState.sourceModel.ports.push(Port.createFromNode(portNode));
        return portNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): PortNodeBuilder {
        return (
            PortNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(PortNode).length)
                .number('8080')
                .addArgs(ArgsUtil.cornerRadius(5))
                .children()
                .nodeType(ModelTypes.PORT)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
