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
import { addNodeAttribute, createPodCardinalityNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreatePodCardinalityOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Pod Cardinality';
    elementTypeIds = [ModelTypes.POD_CARDINALITY];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPodCardinality(operation));
    }

    protected async createPodCardinality(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram){
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Pod Cardinality can't be outside pod");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const pod = ast.isPodNode(astParent) ? astParent : undefined;
        if (!pod) {
            throw new GLSPServerError("Pod Cardinality can't be outside pod");
        }
        if (pod.cardinality) {
            throw new GLSPServerError('Pod Cardinality already exist at ' + pod.name);
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const podCardinality: ast.PodCardinality = createPodCardinalityNode(pod);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod, location);
        pod.cardinality = podCardinality;
    }
}
