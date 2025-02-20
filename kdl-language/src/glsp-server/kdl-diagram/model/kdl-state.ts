/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { KDLDiagram } from '../../../language-server/generated/ast.js';
import { CrossModelState } from '../../common/cross-model-state.js';
import * as ast from '../../../language-server/generated/ast.js';

@injectable()
export class KDLModelState extends CrossModelState {
    get kdlDiagram(): KDLDiagram {
        const kdlDiagram = this.semanticRoot.kdlDiagram!;
        if (!kdlDiagram.diagram) {
            kdlDiagram.diagram = {
                $container: kdlDiagram,
                $type: ast.Diagram,
                edgeAttributes: [],
                nodeAttributes: []
            };
        } else {
            kdlDiagram.diagram.nodeAttributes = kdlDiagram.diagram.nodeAttributes.filter(attr => attr.nodeID.ref !== undefined);
            kdlDiagram.diagram.edgeAttributes = kdlDiagram.diagram.edgeAttributes.filter(attr => attr.sourceID.ref && attr.targetID.ref);
        }
        return kdlDiagram;
    }
}
