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
import { ClusterNode } from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as uuid from 'uuid';

@injectable()
export class KDLDiagramCreateEntityOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Cluster';
    elementTypeIds = [ModelTypes.CLUSTER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation): Promise<void> {
        const container = this.modelState.kdlDiagram;
        const location = this.getLocation(operation) ?? Point.ORIGIN;
        const cluster: ClusterNode = {
            $type: ClusterNode,
            $container: container,
            id: uuid.v4(),
            name: 'CLusterNode',
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            customProperties: []
        };
        container.clusters.push(cluster);
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(cluster)}_label`
        } as Action);
    }
}
