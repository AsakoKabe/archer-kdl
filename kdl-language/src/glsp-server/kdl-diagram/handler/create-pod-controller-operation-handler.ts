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
import { addNodeAttribute, createPodControllerNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreatePodControllerOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Pod Controller';
    elementTypeIds = [ModelTypes.POD_CONTROLLER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPodController(operation));
    }

    protected async createPodController(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Pod Controller can't be outside pod");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const pod = ast.isPodNode(astParent) ? astParent : undefined;
        if (!pod) {
            throw new GLSPServerError("Pod Controller can't be outside pod");
        }
        if (pod.controller) {
            throw new GLSPServerError('Pod Controller already exist at ' + pod.name);
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const podController: ast.PodController = createPodControllerNode(pod);
        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, pod, location);
        pod.controller = podController;
    }
}
