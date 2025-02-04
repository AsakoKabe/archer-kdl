import {
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
import { IngressNode, IngressNodeBuilder } from '../graph/ingress-node.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Cluster, Ingress } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreateIngressHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.INGRESS];
    label = 'Ingress';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof IngressNode) {
            const structComp = this.getPodCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getPodCompartment(ingress: IngressNode): GCompartment | undefined {
        return ingress.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Ingress can't be outside cluster");
        }
        const ingressNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Cluster.is(parent)) {
            parent.ingress_ids.push(ingressNode.id);
        }
        this.modelState.sourceModel.ingresses.push(Ingress.createFromNode(ingressNode));
        return ingressNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): IngressNodeBuilder {
        return (
            IngressNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(IngressNode).length)
                // .addArgs(ArgsUtil.cornerRadius(5))
                .host('example.com')
                .children()
                .nodeType(ModelTypes.INGRESS)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
