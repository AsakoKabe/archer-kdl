/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    ActionDispatcher,
    Command,
    CreateNodeOperation,
    GLSPServerError,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    ModelState,
    Point
} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { addNodeAttribute, createServiceNode } from '../model/graph-extension/utils.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramCreateServiceOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Service';
    elementTypeIds = [ModelTypes.SERVICE];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createService(operation));
    }

    protected async createService(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Service can't be outside cluster");
        }
        const clusterNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isClusterNode);
        if (!clusterNode) {
            throw new GLSPServerError('Cluster node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const service = createServiceNode(clusterNode);
        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, service, location);
        clusterNode.services.push(service);
    }
}
