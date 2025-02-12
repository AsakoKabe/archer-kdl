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
import { addNodeAttribute, createPodNode } from '../model/graph-extension/utils.js';
import { KDLModelState } from '../model/kdl-state.js';

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
        if (!operation.containerId) {
            throw new GLSPServerError("Pod can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const pod = createPodNode(kdlDiagram);

        addNodeAttribute(kdlDiagram, this.modelState.idProvider, pod, location);
        kdlDiagram.model!.pods.push(pod);

        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.pods.push({ ref: pod, $refText: this.modelState.idProvider.getLocalId(pod) || pod.id || '' });
        }
    }
}
