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
import { addNodeAttribute, createPodNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreatePodOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Pod';
    elementTypeIds = [ModelTypes.POD];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPod(operation));
    }
    protected async createPod(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Pod can't be outside namespace");
        }
        const namespaceNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isNamespaceNode);
        if (!namespaceNode) {
            throw new GLSPServerError('Namespace node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const pod = createPodNode(namespaceNode);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod, location);
        if (pod.controller) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod.controller, location);
        }
        if (pod.cardinality) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod.cardinality, location);
        }
        namespaceNode.pods.push(pod);
    }
}
