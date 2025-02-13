import { Dimension, Point } from '@eclipse-glsp/server';
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
    kdlDiagram.diagram!.nodeAttributes.push(createNodeAttribute(kdlDiagram, idProvider, node, location));
}

export function createNodeAttribute(
    kdlDiagram: ast.KDLDiagram,
    idProvider: IdProvider,
    node: KDLNode,
    location?: Point,
    dim?: Dimension,
): ast.NodeAttribute {
    const attribute: ast.NodeAttribute = {
        $type: ast.NodeAttribute,
        $container: kdlDiagram.diagram!,
        id: ast.NodeAttribute + kdlDiagram.diagram!.nodeAttributes.length,
        nodeID: {
            $refText: idProvider.getLocalId(node) || node.id || '',
            ref: node
        },
        dimensions: {} as ast.Dimensions
    };

    const dimensions: ast.Dimensions = {
        x: location ? location.x : Point.ORIGIN.x,
        y: location ? location.y : Point.ORIGIN.y,
        width: dim? dim.width : 10,
        height: dim? dim.height : 10,
        $container: attribute,
        $type: ast.Dimensions
    };
    attribute.dimensions = dimensions;

    return attribute;
}

export function addEdgeAttribute(
    kdlDiagram: ast.KDLDiagram,
    sourceID: string,
    targetID: string,
    sourceNode: ast.SourceNodeType,
    targetNode: ast.TargetNodeType
) {
    kdlDiagram.diagram!.edgeAttributes.push({
        $container: kdlDiagram.diagram!,
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
    });
}

export function createClusterNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.ClusterNode {
    return {
        $type: ast.ClusterNode,
        $container: kdlDiagram,
        id: 'ClusterNode' + kdlDiagram.clusters.length,
        name: name ? name : 'ClusterNode' + kdlDiagram.clusters.length,
        ingresses: [],
        pods: [],
        services: []
    };
}

export function createContainerNode(pod: ast.PodNode, name?: string): ast.ContainerNode {
    return {
        $type: ast.ContainerNode,
        $container: pod,
        id: 'ContainerNode' + pod.containers.length,
        name: name ? name : 'ContainerNode' + pod.containers.length,
        links: []
    };
}

export function createIngressNode(clusterNode: ast.ClusterNode, name?: string, host?: string): ast.IngressNode {
    return {
        $type: ast.IngressNode,
        $container: clusterNode,
        id: 'IngressNode' + clusterNode.ingresses.length,
        name: name ? name : 'IngressNode' + clusterNode.ingresses.length,
        host: host ? host : 'localhost',
        links: []
    };
}

export function createPodNode(cluster: ast.ClusterNode, name?: string): ast.PodNode {
    return {
        $type: ast.PodNode,
        $container: cluster,
        id: 'PodNode' + cluster.pods.length,
        name: name ? name : 'PodNode' + cluster.pods.length,
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

export function createServiceNode(cluster: ast.ClusterNode, name?: string): ast.ServiceNode {
    return {
        $type: ast.ServiceNode,
        $container: cluster,
        id: 'ServiceNode' + cluster.services.length,
        name: name ? name : 'ServiceNode' + cluster.services.length,
        ports: [],
        links: []
    };
}
