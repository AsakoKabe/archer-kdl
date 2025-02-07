import { ChangeRoutingPointsOperation, Command, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramChangeRoutingPointsOperation extends JsonOperationHandler {
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
        // const sourceID = elementId.split("$")[0];
        // const targerID = elementId.split("$")[1];
        // const edge = this.modelState.index.findSemanticElement(elementId);
        // console.error('edge', edge);

        // if (newRoutingPoints) {
        //     if (edge) {
        //         edge.routingPoints = newRoutingPoints;
        //     }
        // }
    }
}
