import { ChangeRoutingPointsOperation, Command, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-model-state.js';

@injectable()
export class KDLChangeRoutingPointsHandler extends JsonOperationHandler {
    readonly operationType = ChangeRoutingPointsOperation.KIND;

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    override createCommand(operation: ChangeRoutingPointsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.newRoutingPoints.forEach(elementAndPoints => {
                this.changeElementRoutinPoints(elementAndPoints.elementId, elementAndPoints.newRoutingPoints);
            });
        });
    }

    protected changeElementRoutinPoints(elementId: string, newRoutingPoints: Point[] | undefined): void {
        const index = this.modelState.index;
        const edge = index.findTransition(elementId);

        if (newRoutingPoints) {
            if (edge) {
                edge.routingPoints = newRoutingPoints;
            }
        }
    }
}
