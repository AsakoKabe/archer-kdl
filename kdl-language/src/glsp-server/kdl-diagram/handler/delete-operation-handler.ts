/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, ModelState, remove } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import {
    ClusterNode,
    EntityNode,
    RelationshipEdge,
    isClusterNode,
    isEntityNode,
    isRelationshipEdge
} from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramDeleteOperationHandler extends JsonOperationHandler {
    operationType = DeleteElementOperation.KIND;

    @inject(ModelState) protected override modelState!: KDLModelState;

    override createCommand(operation: DeleteElementOperation): Command | undefined {
        const deleteInfo = this.findElementsToDelete(operation);
        if (deleteInfo.clusters.length === 0) {
            return undefined;
        }
        return new CrossModelCommand(this.modelState, () => this.deleteElements(deleteInfo));
    }

    protected deleteElements(deleteInfo: DeleteInfo): void {
        const clusters = this.modelState.kdlDiagram.clusters;
        remove(clusters, ...deleteInfo.clusters);
    }

    protected findElementsToDelete(operation: DeleteElementOperation): DeleteInfo {
        const deleteInfo: DeleteInfo = { clusters: [] };

        for (const elementId of operation.elementIds) {
            const element = this.modelState.index.findSemanticElement(elementId, isDiagramElement);
            // simply remove any diagram nodes or edges from the diagram
            if (isClusterNode(element)) {
                deleteInfo.clusters.push(element);
            }
        }
        return deleteInfo;
    }
}

function isDiagramElement(item: unknown): item is RelationshipEdge | EntityNode {
    return isRelationshipEdge(item) || isEntityNode(item);
}

interface DeleteInfo {
    clusters: ClusterNode[];
}
