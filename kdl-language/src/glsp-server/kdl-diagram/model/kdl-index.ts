/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { CrossModelIndex } from '../../common/cross-model-index.js';
import { AstNode } from 'langium';

@injectable()
export class KDLModelIndex extends CrossModelIndex {
    protected override indexAstNode(node: AstNode): void {
        super.indexAstNode(node);
    }
}
