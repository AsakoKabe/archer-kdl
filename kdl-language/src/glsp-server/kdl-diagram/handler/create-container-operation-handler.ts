/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    Action,
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

@injectable()
export class KDLDiagramCreateContainerOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Container';
    elementTypeIds = [ModelTypes.CONTAINER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Container can't be outside cluster");
        }
        const container = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;

        const containerNode: ast.ContainerNode = {
            $type: ast.ContainerNode,
            $container: container,
            id: 'ContainerNode' + this.modelState.kdlDiagram.containers.length,
            name: 'ContainerNode' + this.modelState.kdlDiagram.containers.length,
            links: [],
        };
        containerNode.dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: containerNode,
            $type: ast.Dimensions
        },
        container.containers.push(containerNode);
        const pod = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isPodNode(pod)) {
            pod.containers.push(
                { ref: containerNode, $refText: this.modelState.idProvider.getLocalId(containerNode) || pod.id || '' }
            );
        }
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(pod)}_label`
        } as Action);
    }
}
