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
    Point} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { addNodeAttribute, BaseDim, createContainerNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreateContainerOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Container';
    elementTypeIds = [ModelTypes.CONTAINER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createContainer(operation));
    }

    protected async createContainer(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram){
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Container can't be outside pod");
        }
        const podNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isPodNode);
        if (!podNode) {
            throw new GLSPServerError('Pod node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const containerNode = createContainerNode(podNode);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, containerNode, location, BaseDim.Container);
        podNode.containers.push(containerNode);
    }
}
