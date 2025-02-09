/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { CrossModelIndex } from '../../common/cross-model-index.js';

@injectable()
export class KDLModelIndex extends CrossModelIndex {
    // findClusterNode(id: string): ClusterNode | undefined {
    //     return this.findSemanticElement(id, isClusterNode);
    // }

    // protected override indexAstNode(node: AstNode): void {
    //     super.indexAstNode(node);
    //     if (isEntityNode(node)) {
    //         this.indexSemanticElement(`${this.createId(node)}_label`, node);
    //     }
    // }
}
