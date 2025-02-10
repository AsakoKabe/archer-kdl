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
import { addNodeAttribute, createContainerNode } from '../model/graph-extension/utils.js';
import { KDLModelState } from '../model/kdl-state.js';

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
        if (!operation.containerId) {
            throw new GLSPServerError("Container can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const containerNode = createContainerNode(kdlDiagram);

        addNodeAttribute(kdlDiagram, this.modelState.idProvider, containerNode, location);
        kdlDiagram.model.containers.push(containerNode);

        const pod = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isPodNode(pod)) {
            pod.containers.push({ ref: containerNode, $refText: this.modelState.idProvider.getLocalId(containerNode) || pod.id || '' });
        }
    }
}
