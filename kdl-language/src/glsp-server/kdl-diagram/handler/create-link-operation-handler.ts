/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
    ActionDispatcher,
    Command,
    CreateEdgeOperation,
    DefaultTypes,
    GLSPServerError,
    JsonCreateEdgeOperationHandler,
    ModelState
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { isContainerNode, isIngressNode, isPortNode, isServiceNode } from '../../../language-server/generated/ast.js';
import { addEdgeAttribute } from '../model/graph-extension/utils.js';


@injectable()
export class KDLDiagramCreateLinkOperationHandler extends JsonCreateEdgeOperationHandler {
    override label = 'Link';
    elementTypeIds = [DefaultTypes.EDGE];

    @inject(ModelState) protected override modelState!: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    createCommand(operation: CreateEdgeOperation): Command {
        return new CrossModelCommand(this.modelState, () => this.createEdge(operation));
    }

    protected async createEdge(operation: CreateEdgeOperation): Promise<void> {
        const sourceID = operation.sourceElementId;
        const targetID = operation.targetElementId;
        const sourceNode = this.modelState.index.findSemanticElement(sourceID);
        const targetNode = this.modelState.index.findSemanticElement(targetID);
        if (!sourceNode || !targetNode) {
            throw new GLSPServerError('Source or target node not found');
        }

        if ((isIngressNode(sourceNode) || isContainerNode(sourceNode) || isServiceNode(sourceNode)) && isPortNode(targetNode)) {
            sourceNode.links.push({ ref: targetNode, $refText: operation.targetElementId });

            addEdgeAttribute(this.modelState.kdlDiagram, sourceID, targetID, sourceNode, targetNode);
        }
    }
}
