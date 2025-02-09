import { ChangeRoutingPointsOperation, Command, GLSPServerError, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-state.js';
import * as ast from '../../../language-server/generated/ast.js';

@injectable()
export class KDLDiagramChangeRoutingPointsOperation extends JsonOperationHandler {
    readonly operationType = ChangeRoutingPointsOperation.KIND;

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    override createCommand(operation: ChangeRoutingPointsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.newRoutingPoints.forEach(elementAndPoints => {
                this.changeElementRoutingPoints(elementAndPoints.elementId, elementAndPoints.newRoutingPoints);
            });
        });
    }

    protected changeElementRoutingPoints(elementId: string, newRoutingPoints: Point[] | undefined): void {
        const edge = this.modelState.index.findSemanticElement(elementId, ast.isEdgeAttribute);
        if (!edge) {
            throw new GLSPServerError(`Edge with id ${elementId} not found`);
        }

        if (newRoutingPoints) {
            // edge.points = [];

            // newRoutingPoints.forEach(point => {
            //     edge.points.push({
            //         ...point,
            //         $container: edge,
            //         $type: ast.Point,
            //     })
            // })
            
        }
    }
}
