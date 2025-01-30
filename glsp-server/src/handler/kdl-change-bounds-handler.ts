import { ChangeBoundsOperation, Command, Dimension, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-model-state';

@injectable()
export class KDLChangeBoundsHandler extends JsonOperationHandler {
    readonly operationType = ChangeBoundsOperation.KIND;

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    override createCommand(operation: ChangeBoundsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.newBounds.forEach(element => this.changeElementBounds(element.elementId, element.newSize, element.newPosition));
        });
    }

    protected changeElementBounds(elementId: string, newSize: Dimension, newPosition?: Point): void {
        const index = this.modelState.index;
        const box = index.findBoxes(elementId);

        if (box) {
            box.size = newSize;
            if (newPosition) {
                box.position = newPosition;
            }
        }
    }
}
