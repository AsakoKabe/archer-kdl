/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
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
import * as ast from '../../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../../common/cross-model-command.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';

export function createPortNode(container: ast.PodNode | ast.ServiceNode, number?: number, name?: string): ast.PortNode {
    return {
        $type: ast.PortNode,
        $container: container,
        id: 'Port' + container.ports.length,
        name: name ? name : 'PortNode' + container.ports.length,
        number: number ? number : 8080
    };
}

@injectable()
export class KDLDiagramCreatePortOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Port';
    elementTypeIds = [ModelTypes.PORT];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPort(operation));
    }

    protected async createPort(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const container = ast.isServiceNode(astParent) || ast.isPodNode(astParent) ? astParent : undefined;
        if (!container) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const port: ast.PortNode = createPortNode(container);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, port, location);
        container.ports.push(port);
    }
}
