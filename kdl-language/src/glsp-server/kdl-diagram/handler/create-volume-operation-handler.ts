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
import { addNodeAttribute, createVolumeNode } from '../model/utils.js';

@injectable()
export class KDLDiagramCreateVolumeOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Volume';
    elementTypeIds = [ModelTypes.VOLUME];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createVolume(operation));
    }

    protected async createVolume(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram){
            return
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Volume can't be outside pod");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const pod = ast.isPodNode(astParent) ? astParent : undefined;
        if (!pod) {
            throw new GLSPServerError("Volume can't be outside pod");
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const volume: ast.VolumeNode = createVolumeNode(pod);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, volume, location);
        pod.volumes.push(volume);
    }
}
