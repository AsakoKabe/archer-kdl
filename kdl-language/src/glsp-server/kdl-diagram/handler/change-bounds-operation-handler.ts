/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ChangeBoundsOperation, Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramChangeBoundsOperationHandler extends JsonOperationHandler {
    operationType = ChangeBoundsOperation.KIND;
    @inject(ModelState) protected override modelState!: KDLModelState;

    createCommand(operation: ChangeBoundsOperation): Command {
        return new CrossModelCommand(this.modelState, () => this.changeBounds(operation));
    }

    protected changeBounds(operation: ChangeBoundsOperation): void {
        operation.newBounds.forEach(elementAndBounds => {
            const node = this.modelState.index.findSemanticElement(elementAndBounds.elementId);
            const nodeAttribute = 
                this.modelState.kdlDiagram.diagram.nodeAttributes.find(nodeAttribute => nodeAttribute.nodeID.ref === node);

            if (nodeAttribute) {
                nodeAttribute.dimensions.x = elementAndBounds.newPosition?.x || nodeAttribute.dimensions.x;
                nodeAttribute.dimensions.y = elementAndBounds.newPosition?.y || nodeAttribute.dimensions.y;
                nodeAttribute.dimensions.width = elementAndBounds.newSize.width;
                nodeAttribute.dimensions.height = elementAndBounds.newSize.height;
            }
        });
    }
}
