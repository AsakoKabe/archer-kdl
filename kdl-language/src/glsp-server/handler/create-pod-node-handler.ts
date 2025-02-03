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
import { KDLModelState } from '../model/kdl-model-state.js';
import { Cluster, Pod } from '../model/kdl-model.js';
import { PodNode, PodNodeBuilder } from '../model/pod-node.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreatePodHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.POD];
    label = 'Pod';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof PodNode) {
            const structComp = this.getPodCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getPodCompartment(pod: PodNode): GCompartment | undefined {
        return pod.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Pod can't be outside cluster");
        }
        const podNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Cluster.is(parent)) {
            parent.pod_ids.push(podNode.id);
        }
        this.modelState.sourceModel.pods.push(Pod.createFromNode(podNode));
        return podNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): PodNodeBuilder {
        return PodNode.builder()
            .type(elementTypeId)
            .position(point)
            .size(100, 100)
            .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(PodNode).length)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .nodeType(ModelTypes.POD);
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
