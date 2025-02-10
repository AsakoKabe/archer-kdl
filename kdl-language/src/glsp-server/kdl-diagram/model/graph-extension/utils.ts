import { Point } from '@eclipse-glsp/server';
import { AstNode } from 'langium';
import * as ast from '../../../../language-server/generated/ast.js';
import { IdProvider } from '../../../../language-server/kdl-naming.js';

export function isKDLNode(
    node: AstNode | unknown
): node is ast.ClusterNode | ast.PodNode | ast.ServiceNode | ast.IngressNode | ast.PortNode | ast.ContainerNode {
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
export function createEdgeID(sourceID: string, targetID: string): string {
    return `${sourceID}-${targetID}`.replaceAll('.', '_');
}

export function addNodeAttribute(kdlDiagram: ast.KDLDiagram, idProvider: IdProvider, node: KDLNode, location?: Point) {
    const attribute: ast.NodeAttribute = {
        $type: ast.NodeAttribute,
        $container: kdlDiagram.diagram,
        nodeID: {
            $refText: idProvider.getLocalId(node) || node.id || '',
            ref: node
        },
        dimensions: {} as ast.Dimensions
    };
    const dimensions: ast.Dimensions = {
        x: location ? location.x : Point.ORIGIN.x,
        y: location ? location.y : Point.ORIGIN.y,
        width: 10,
        height: 10,
        $container: attribute,
        $type: ast.Dimensions
    };
    attribute.dimensions = dimensions;
    kdlDiagram.diagram.nodeAttributes.push(attribute);
}

export function addEdgeAttribute(kdlDiagram: ast.KDLDiagram, sourceID: string, targetID: string, sourceNode: KDLNode, targetNode: KDLNode) {
   kdlDiagram.diagram.edgeAttributes.push({
        $container: kdlDiagram.diagram,
        $type: ast.EdgeAttribute,
        id: createEdgeID(sourceID, targetID),
        sourceID: {
            ref: sourceNode,
            $refText: sourceID
        },
        targetID: {
            ref: targetNode,
            $refText: targetID
        }
    })
}

export function createClusterNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.ClusterNode {
    return {
        $type: ast.ClusterNode,
        $container: kdlDiagram.model,
        id: 'ClusterNode' + kdlDiagram.model.clusters.length,
        name: name ? name : 'ClusterNode' + kdlDiagram.model.clusters.length,
        ingresses: [],
        pods: [],
        services: []
    };
}

export function createContainerNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.ContainerNode {
    return {
        $type: ast.ContainerNode,
        $container: kdlDiagram.model,
        id: 'ContainerNode' + kdlDiagram.model.containers.length,
        name: name ? name : 'ContainerNode' + kdlDiagram.model.containers.length,
        links: []
    };
}

export function createIngressNode(kdlDiagram: ast.KDLDiagram, name?: string, host?: string): ast.IngressNode {
    return {
        $type: ast.IngressNode,
        $container: kdlDiagram.model,
        id: 'IngressNode' + kdlDiagram.model.ingresses.length,
        name: name ? name : 'IngressNode' + kdlDiagram.model.ingresses.length,
        host: host ? host : 'localhost',
        links: []
    };
}

export function createPodNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.PodNode {
    return {
        $type: ast.PodNode,
        $container: kdlDiagram.model,
        id: 'PodNode' + kdlDiagram.model.pods.length,
        name: name ? name : 'PodNode' + kdlDiagram.model.pods.length,
        containers: [],
        ports: []
    };
}

export function createPortNode(container: ast.PodNode | ast.ServiceNode, number?: number, name?: string): ast.PortNode {
    return {
        $type: ast.PortNode,
        $container: container,
        id: container.name + 'Port' + container.ports.length,
        name: name ? name : 'PortNode' + container.ports.length,
        number: number ? number : 8080
    };
}

export function createServiceNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.ServiceNode {
    return {
        $type: ast.ServiceNode,
        $container: kdlDiagram.model,
        id: 'ServiceNode' + kdlDiagram.model.services.length,
        name: name ? name : 'ServiceNode' + kdlDiagram.model.services.length,
        ports: [],
        links: []
    };
}
