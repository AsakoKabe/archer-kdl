/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { KDLDiagram } from '../../../language-server/generated/ast.js';
import { CrossModelState } from '../../common/cross-model-state.js';
import { KDLModelIndex } from './kdl-index.js';
import * as ast from '../../../language-server/generated/ast.js';


@injectable()
export class KDLModelState extends CrossModelState {
    @inject(KDLModelIndex) declare readonly index: KDLModelIndex;

    get kdlDiagram(): KDLDiagram {
        const kdlDiagram = this.semanticRoot.kdlDiagram!
        if (!kdlDiagram.diagram){
            kdlDiagram.diagram = {
                $container: kdlDiagram,
                $type: ast.Diagram,
                edgeAttributes: [],
                nodeAttributes: []
            };
        }
        return kdlDiagram;
    }
}
