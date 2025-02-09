/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    ActionDispatcher,
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    ModelState,
    Point
} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramCreateClusterOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Cluster';
    elementTypeIds = [ModelTypes.CLUSTER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createCluster(operation));
    }

    protected async createCluster(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const cluster = this.createClusterNode(kdlDiagram);

        this.createNodeAttribute(kdlDiagram, cluster, location);
        kdlDiagram.model.clusters.push(cluster);
    }

    private createClusterNode(kdlDiagram: ast.KDLDiagram): ast.ClusterNode {
        return {
            $type: ast.ClusterNode,
            $container: kdlDiagram.model,
            id: 'ClusterNode' + kdlDiagram.model.clusters.length,
            name: 'ClusterNode' + kdlDiagram.model.clusters.length,
            ingresses: [],
            pods: [],
            services: []
        };
    }
    private createNodeAttribute(kdlDiagram: ast.KDLDiagram, cluster: ast.ClusterNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram.diagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(cluster) || cluster.id || '',
                ref: cluster
            },
            dimensions: {} as ast.Dimensions
        };
        const dimensions: ast.Dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: attribute,
            $type: ast.Dimensions
        };
        attribute.dimensions = dimensions;
        kdlDiagram.diagram.nodeAttributes.push(attribute);
    }
}
