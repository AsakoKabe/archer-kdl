/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ChangeBoundsOperation, Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as ast from '../../../language-server/generated/ast.js';

@injectable()
export class KDLDiagramChangeBoundsOperationHandler extends JsonOperationHandler {
    operationType = ChangeBoundsOperation.KIND;
    @inject(ModelState) protected override modelState!: KDLModelState;

    createCommand(operation: ChangeBoundsOperation): Command {
        return new CrossModelCommand(this.modelState, () => this.changeBounds(operation));
    }

    protected isDimensionNode(
        item: unknown
    ): item is ast.ClusterNode | ast.PodNode | ast.ServiceNode | ast.IngressNode | ast.PortNode | ast.ContainerNode {
        return (
            ast.isClusterNode(item) ||
            ast.isPodNode(item) ||
            ast.isServiceNode(item) ||
            ast.isIngressNode(item) ||
            ast.isPortNode(item) ||
            ast.isContainerNode(item)
        );
    }

    protected changeBounds(operation: ChangeBoundsOperation): void {
        operation.newBounds.forEach(elementAndBounds => {
            const node = this.modelState.index.findSemanticElement(elementAndBounds.elementId, this.isDimensionNode);
            if (node) {
                if (!node.dimensions){
                    node.dimensions = {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                        $container: node,
                        $type: ast.Dimensions
                    }
                }
                node.dimensions.x = elementAndBounds.newPosition?.x || node.dimensions.x;
                node.dimensions.y = elementAndBounds.newPosition?.y || node.dimensions.y;
                node.dimensions.width = elementAndBounds.newSize.width;
                node.dimensions.height = elementAndBounds.newSize.height;
            }
        });
    }
}
