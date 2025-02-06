/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    Action,
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
        return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        const container = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const cluster: ast.ClusterNode = {
            $type: ast.ClusterNode,
            $container: container,
            id: 'ClusterNode' + this.modelState.kdlDiagram.clusters.length,
            name: 'ClusterNode' + this.modelState.kdlDiagram.clusters.length,
            ingresses: [],
            pods: [],
            services: []
        };
        cluster.dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: cluster,
            $type: ast.Dimensions
        };
        container.clusters.push(cluster);
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(cluster)}_label`
        } as Action);
    }
}
