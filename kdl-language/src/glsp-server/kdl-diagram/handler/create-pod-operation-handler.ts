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
import * as uuid from 'uuid';
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramCreatePodOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Pod';
    elementTypeIds = [ModelTypes.POD];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Pod can't be outside cluster");
        }
        const container = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;

        const pod: ast.PodNode = {
            $type: ast.PodNode,
            $container: container,
            id: uuid.v4(),
            name: 'PodNode',
            containers: [],
            ports: []
        };
        pod.dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: pod,
            $type: ast.Dimensions
        },
        container.pods.push(pod);
        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.pods.push(
                { ref: pod, $refText: this.modelState.idProvider.getLocalId(pod) || pod.id || '' }
            );
        }
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(pod)}_label`
        } as Action);
    }
}
