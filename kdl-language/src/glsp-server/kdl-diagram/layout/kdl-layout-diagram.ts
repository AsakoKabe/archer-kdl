import { injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { KDLDiagram } from '../../../language-server/generated/ast.js';

@injectable()
export class KDLLayoutDiagram {
    private kdlDiagram: KDLDiagram;
    private nodeAttrMapping: Map<ast.NodeType, ast.NodeAttribute>;

    constructor(kdlDiagram: KDLDiagram){
        this.kdlDiagram = kdlDiagram;
        this.kdlDiagram.diagram!.nodeAttributes.forEach(attr => this.nodeAttrMapping.set(attr.nodeID.ref!, attr))
    }

    protected layout(): void{
        

    }
}
