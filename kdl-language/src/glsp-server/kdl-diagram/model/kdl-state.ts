/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { KDLDiagram } from '../../../language-server/generated/ast.js';
import { CrossModelState } from '../../common/cross-model-state.js';
import { KDLModelIndex } from './kdl-index.js';

@injectable()
export class KDLModelState extends CrossModelState {
    @inject(KDLModelIndex) declare readonly index: KDLModelIndex;

    get kdlDiagram(): KDLDiagram {
        return this.semanticRoot.kdlDiagram!;
    }
}
