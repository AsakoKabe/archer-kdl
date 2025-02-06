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
export class KDLDiagramCreateIngressOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Ingress';
    elementTypeIds = [ModelTypes.INGRESS];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Ingress can't be outside cluster");
        }
        const container = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;

        const ingress: ast.IngressNode = {
            $type: ast.IngressNode,
            $container: container,
            id: uuid.v4(),
            name: 'IngressNode',
            host: 'localhost'
        };
        ingress.dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: ingress,
            $type: ast.Dimensions
        };
        container.ingresses.push(ingress);
        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.ingresses.push({ ref: ingress, $refText: this.modelState.idProvider.getLocalId(ingress) || ingress.id || '' });
        }
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(ingress)}_label`
        } as Action);
    }
}
