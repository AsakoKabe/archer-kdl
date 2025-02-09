import * as ast from '../../../../language-server/generated/ast.js';
import { AstNode } from "langium";

export function isKDLNode(node: AstNode | unknown): node is ast.ClusterNode | ast.PodNode | ast.ServiceNode | ast.IngressNode | ast.PortNode | ast.ContainerNode {
    return (
        ast.isClusterNode(node) ||
        ast.isPodNode(node) ||
        ast.isServiceNode(node) ||
        ast.isIngressNode(node) ||
        ast.isPortNode(node) ||
        ast.isContainerNode(node)
    );
}

export type KDLNode = ast.ClusterNode | ast.PodNode | ast.ServiceNode | ast.IngressNode | ast.PortNode | ast.ContainerNode;