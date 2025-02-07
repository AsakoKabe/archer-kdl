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
export class KDLDiagramCreatePortOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Port';
    elementTypeIds = [ModelTypes.PORT];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        let container: ast.PodNode | ast.ServiceNode | undefined = undefined;
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isServiceNode(astParent)) {
            container = astParent;
        } else if (ast.isPodNode(astParent)) {
            container = astParent;
        }
        if (!container){
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const port: ast.PortNode = {
            $type: ast.PortNode,
            $container: container,
            id: container.$type + 'Port' + container.ports.length,
            name: 'PortNode' + container.ports.length,
            number: 8080
        };
        port.dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: port,
            $type: ast.Dimensions
        },
        container.ports.push(port);

        // const parent = this.modelState.index.findSemanticElement(operation.containerId);
        // if (ast.isPodNode(parent) || ast.isServiceNode(parent)) {
        //     parent.ports.push(
        //         { ref: port, $refText: this.modelState.idProvider.getLocalId(port) || port.id || '' }
        //     );
        // }
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(port)}_label`
        } as Action);
    }
}
