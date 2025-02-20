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
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { addNodeAttribute, createClusterNode } from '../model/utils.js';

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
        const cluster = createClusterNode(kdlDiagram);
        if (!kdlDiagram.diagram){
            return;
        }
        addNodeAttribute(kdlDiagram.diagram, this.modelState.idProvider, cluster, location);
        kdlDiagram.clusters.push(cluster);
    }
}
