import {
    ArgsUtil,
    CreateNodeOperation,
    GCompartment,
    GhostElement,
    GModelCreateNodeOperationHandler,
    GModelElement,
    GNode,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ClusterNode, ClusterNodeBuilder } from '../model/cluster-node.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Cluster } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class CreateClusterHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.CLUSTER];
    label = 'Cluster';

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof ClusterNode) {
            const structComp = this.getClusterCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getClusterCompartment(cluster: ClusterNode): GCompartment | undefined {
        return cluster.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        const clusterNode = this.builder(relativeLocation).build();
        this.modelState.sourceModel.clusters.push(Cluster.createFromNode(clusterNode));
        return clusterNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): ClusterNodeBuilder {
        return ClusterNode.builder()
            .type(elementTypeId)
            .position(point)
            .size(100, 100)
            .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(ClusterNode).length)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .nodeType(ModelTypes.CLUSTER);
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
