/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { AstNode } from 'langium';
import {
    ClusterNode,
    Entity,
    EntityNode,
    Relationship,
    RelationshipEdge,
    isClusterNode,
    isEntity,
    isEntityNode,
    isRelationship,
    isRelationshipEdge
} from '../../../language-server/generated/ast.js';
import { CrossModelIndex } from '../../common/cross-model-index.js';

@injectable()
export class KDLModelIndex extends CrossModelIndex {
    findEntity(id: string): Entity | undefined {
        return this.findSemanticElement(id, isEntity);
    }

    findRelationship(id: string): Relationship | undefined {
        return this.findSemanticElement(id, isRelationship);
    }

    findEntityNode(id: string): EntityNode | undefined {
        return this.findSemanticElement(id, isEntityNode);
    }

    findRelationshipEdge(id: string): RelationshipEdge | undefined {
        return this.findSemanticElement(id, isRelationshipEdge);
    }

    findClusterNode(id: string): ClusterNode | undefined {
        return this.findSemanticElement(id, isClusterNode);
    }

    protected override indexAstNode(node: AstNode): void {
        super.indexAstNode(node);
        if (isEntityNode(node)) {
            this.indexSemanticElement(`${this.createId(node)}_label`, node);
        }
    }
}
