/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ChangeBoundsOperation, Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as ast from '../../../language-server/generated/ast.js';
import { AstNode } from 'langium';

@injectable()
export class KDLDiagramChangeBoundsOperationHandler extends JsonOperationHandler {
    operationType = ChangeBoundsOperation.KIND;
    @inject(ModelState) protected override modelState!: KDLModelState;

    createCommand(operation: ChangeBoundsOperation): Command {
        return new CrossModelCommand(this.modelState, () => this.changeBounds(operation));
    }

    protected isDimensionNode(
        node: AstNode
    ): ast.ClusterNode | ast.PodNode | ast.ServiceNode | ast.IngressNode | ast.PortNode | ast.ContainerNode | undefined {
        if (ast.isClusterNode(node)) {
            return node;
        } else if (ast.isPodNode(node)) {
            return node;
        } else if (ast.isServiceNode(node)) {
            return node;
        } else if (ast.isIngressNode(node)) {
            return node;
        } else if (ast.isPortNode(node)) {
            return node;
        } else if (ast.isContainerNode(node)) {
            return node;
        }
        return undefined;
    }

    protected changeBounds(operation: ChangeBoundsOperation): void {
        operation.newBounds.forEach(elementAndBounds => {
            const node = this.modelState.index.findSemanticElement(elementAndBounds.elementId);
            const dimensionNode = node ? this.isDimensionNode(node) : undefined;
            if (node && dimensionNode?.dimensions) {
                dimensionNode.dimensions.x = elementAndBounds.newPosition?.x || dimensionNode.dimensions.x;
                dimensionNode.dimensions.y = elementAndBounds.newPosition?.y || dimensionNode.dimensions.y;
                dimensionNode.dimensions.width = elementAndBounds.newSize.width;
                dimensionNode.dimensions.height = elementAndBounds.newSize.height;
            }
        });
    }
}
