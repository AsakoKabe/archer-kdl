import { AstNode } from 'langium';
import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp';
import { SemanticTokenTypes } from 'vscode-languageserver-protocol';
import { isClusterNode, isContainerNode, isDimensions, isIngressNode, isKDLDiagram, isPodNode, isPortNode, isServiceNode } from './generated/ast.js';

export class KDLSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
         if (isKDLDiagram(node)) {
            acceptor({
                node,
                keyword: 'kdlDiagram',
                type: SemanticTokenTypes.keyword
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
        } else if (isClusterNode(node)) {
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
        } else if (isIngressNode(node)) {
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
        } else if (isContainerNode(node)) {
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
        } else if (isPortNode(node)) {
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
        } else if (isPodNode(node)) {
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
        } else if (isServiceNode(node)) {
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
        } else if (isDimensions(node)){
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
            });            acceptor({
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
    }
}
