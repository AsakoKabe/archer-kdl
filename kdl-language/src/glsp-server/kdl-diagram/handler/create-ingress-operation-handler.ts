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
import { KDLModelState } from '../model/kdl-state.js';
import { addNodeAttribute, createIngressNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreateIngressOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Ingress';
    elementTypeIds = [ModelTypes.INGRESS];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createIngress(operation));
    }

    protected async createIngress(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Ingress can't be outside cluster");
        }
        const clusterNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isClusterNode);
        if (!clusterNode) {
            throw new GLSPServerError('Cluster node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const ingress = createIngressNode(clusterNode);
        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, ingress, location);
        clusterNode.ingresses.push(ingress);
    }
}
