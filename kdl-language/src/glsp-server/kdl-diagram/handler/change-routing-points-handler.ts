/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { ChangeRoutingPointsOperation, Command, GLSPServerError, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-state.js';
import * as ast from '../../../language-server/generated/ast.js';
import { addEdgeAttribute, parseEdgeID } from '../model/utils.js';

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
        if (edge) {
            if (newRoutingPoints) {
                edge.points = [];
    
                newRoutingPoints.forEach(point => {
                    edge.points.push({
                        ...point,
                        $container: edge,
                        $type: ast.Point,
                    })
                })
                
            }
        } else {
            const { sourceID, targetID }: { sourceID: string; targetID: string } = parseEdgeID(elementId.split('.').pop() || '');
            const source = this.modelState.index.findSemanticElement(sourceID, ast.isSourceNodeType);
            const target = this.modelState.index.findSemanticElement(targetID, ast.isTargetNodeType);
            if (!source || !target) {
                throw new GLSPServerError('Source or target node not found');
            }
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addEdgeAttribute(this.modelState.kdlDiagram.diagram, sourceID, targetID, source, target);
        }


    }
}
