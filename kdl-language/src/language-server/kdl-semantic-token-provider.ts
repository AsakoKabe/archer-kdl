import { AstNode } from 'langium';
import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp';
import { SemanticTokenTypes } from 'vscode-languageserver-protocol';
import { isClusterNode, isContainerNode, isDiagram, isDimensions, isEdgeAttribute, isIngressNode, isKDLDiagram, isModel, isNodeAttribute, isPodNode, isPortNode, isServiceNode } from './generated/ast.js';

export class KDLSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        if (isKDLDiagram(node)) {
            this.highlightKDLDiagram(node, acceptor);
        } else if (isModel(node)) {
            this.highlightModelNode(node, acceptor);
        } else if (isDiagram(node)){
            this.highlightDiagramNode(node, acceptor);
        } else if (isClusterNode(node)) {
            this.highlightClusterNode(node, acceptor);
        } else if (isIngressNode(node)) {
            this.highlightIngressNode(node, acceptor);
        } else if (isContainerNode(node)) {
            this.highlightContainerNode(node, acceptor);
        } else if (isPortNode(node)) {
            this.highlightPortNode(node, acceptor);
        } else if (isPodNode(node)) {
            this.highlightPodNode(node, acceptor);
        } else if (isServiceNode(node)) {
            this.highlightServiceNode(node, acceptor);
        } else if (isDimensions(node)) {
            this.highlightDimensions(node, acceptor);
        } else if (isNodeAttribute(node)) {
            this.highlightNodeAttribute(node, acceptor);
        } else if (isEdgeAttribute(node)) {
            this.highlightEdgeAttribute(node, acceptor);
        }
    }
    private highlightDiagramNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'nodeAttributes',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'edgeAttributes',
            type: SemanticTokenTypes.keyword
        });
    }
    private highlightKDLDiagram(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'kdlDiagram',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'diagram',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'model',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'diagram',
            type: SemanticTokenTypes.keyword
        });
    }

    private highlightModelNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'clusters',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'ingresses',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'services',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'pods',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'containers',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'nodeAttributes',
            type: SemanticTokenTypes.class
        });
        acceptor({
            node,
            keyword: 'edgeAttributes',
            type: SemanticTokenTypes.class
        });
    }


    private highlightClusterNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'ingresses',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'ingresses',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'services',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'services',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'pods',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'pods',
            type: SemanticTokenTypes.parameter
        });
    }

    private highlightIngressNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'host',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'host',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'links',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'links',
            type: SemanticTokenTypes.parameter
        });
    }

    private highlightContainerNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'links',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'links',
            type: SemanticTokenTypes.parameter
        });
    }

    private highlightPortNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'number',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'number',
            type: SemanticTokenTypes.number
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
    }

    private highlightPodNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'containers',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'containers',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'ports',
            type: SemanticTokenTypes.keyword
        });
    }

    private highlightServiceNode(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'name',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            keyword: 'links',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'links',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'ports',
            type: SemanticTokenTypes.keyword
        });
    }

    private highlightDimensions(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'x',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'x',
            type: SemanticTokenTypes.number
        });
        acceptor({
            node,
            keyword: 'y',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'y',
            type: SemanticTokenTypes.number
        });
        acceptor({
            node,
            keyword: 'width',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'width',
            type: SemanticTokenTypes.number
        });
        acceptor({
            node,
            keyword: 'x',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'x',
            type: SemanticTokenTypes.number
        });
        acceptor({
            node,
            keyword: 'height',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'height',
            type: SemanticTokenTypes.number
        });
    }

    private highlightNodeAttribute(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'nodeID',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'nodeID',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'dimensions',
            type: SemanticTokenTypes.keyword
        });
    }

    private highlightEdgeAttribute(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        acceptor({
            node,
            keyword: 'id',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'id',
            type: SemanticTokenTypes.string
        });
        acceptor({
            node,
            keyword: 'sourceID',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'sourceID',
            type: SemanticTokenTypes.parameter
        });
        acceptor({
            node,
            keyword: 'targetID',
            type: SemanticTokenTypes.keyword
        });
        acceptor({
            node,
            property: 'targetID',
            type: SemanticTokenTypes.parameter
        });
    }
}
