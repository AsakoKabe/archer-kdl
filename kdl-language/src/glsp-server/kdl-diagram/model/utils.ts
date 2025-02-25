import { Dimension, Point } from '@eclipse-glsp/server';
import * as ast from '../../../language-server/generated/ast.js';
import { IdProvider } from '../../../language-server/kdl-naming.js';

export function createEdgeID(sourceID: string, targetID: string): string {
    return `${sourceID}-${targetID}`.replaceAll('.', '_');
}

export const BaseDim = {
    Container: {
        width: 40,
        height: 10
    },
    Service: {
        width: 70,
        height: 10
    }
};

export const labelDelimiter = '$';

export function addNodeAttribute(diagram: ast.Diagram, idProvider: IdProvider, node: ast.NodeType, location?: Point, dim?: Dimension) {
    diagram.nodeAttributes.push(createNodeAttribute(diagram, idProvider, node, location, dim));
}

export function createNodeAttribute(
    diagram: ast.Diagram,
    idProvider: IdProvider,
    node: ast.NodeType,
    location?: Point,
    dim?: Dimension
): ast.NodeAttribute {
    const attribute: ast.NodeAttribute = {
        $type: ast.NodeAttribute,
        $container: diagram,
        id: ast.NodeAttribute + diagram.nodeAttributes.length,
        nodeID: {
            $refText: idProvider.getLocalId(node) || node.id || '',
            ref: node
        },
        dimensions: {} as ast.Dimensions
    };

    const dimensions: ast.Dimensions = {
        x: location ? location.x : Point.ORIGIN.x,
        y: location ? location.y : Point.ORIGIN.y,
        width: dim ? dim.width : 10,
        height: dim ? dim.height : 10,
        $container: attribute,
        $type: ast.Dimensions
    };
    attribute.dimensions = dimensions;

    return attribute;
}

export function addEdgeAttribute(
    diagram: ast.Diagram,
    sourceID: string,
    targetID: string,
    sourceNode: ast.SourceNodeType,
    targetNode: ast.TargetNodeType
) {
    diagram.edgeAttributes.push({
        $container: diagram,
        $type: ast.EdgeAttribute,
        id: createEdgeID(sourceID, targetID),
        sourceID: {
            ref: sourceNode,
            $refText: sourceID
        },
        targetID: {
            ref: targetNode,
            $refText: targetID
        },
        points: []
    });
}

export function createNamespaceNode(kdlDiagram: ast.KDLDiagram, name?: string): ast.NamespaceNode {
    return {
        $type: ast.NamespaceNode,
        $container: kdlDiagram,
        id: 'NamespaceNode' + kdlDiagram.namespaces.length,
        name: name ? name : 'NamespaceNode' + kdlDiagram.namespaces.length,
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

export function createIngressNode(namespaceNode: ast.NamespaceNode, name?: string, host?: string): ast.IngressNode {
    return {
        $type: ast.IngressNode,
        $container: namespaceNode,
        id: 'IngressNode' + namespaceNode.ingresses.length,
        name: name ? name : 'IngressNode' + namespaceNode.ingresses.length,
        host: host ? host : 'localhost',
        links: []
    };
}

export function createPodNode(namespace: ast.NamespaceNode, name?: string, controller?: string, replicaFactor?: string): ast.PodNode {
    const pod: ast.PodNode = {
        $type: ast.PodNode,
        $container: namespace,
        id: 'PodNode' + namespace.pods.length,
        name: name ? name : 'PodNode' + namespace.pods.length,
        containers: [],
        ports: [],
        controller: {} as ast.PodController,
        cardinality: {} as ast.PodCardinality,
        volumes: []
    };
    pod.controller = createPodControllerNode(pod, controller);
    pod.cardinality = createPodCardinalityNode(pod, replicaFactor);
    return pod;
}

function getControllerName(name: string): string {
    switch (name) {
        case 'Deployment':
            return 'D';
        case 'StatefulSet':
            return 'SS';
        case 'DaemonSet':
            return 'DS';
        case 'ReplicaSet':
            return 'RS';
        default:
            return name;
    }
}
export function createPodControllerNode(pod: ast.PodNode, name?: string): ast.PodController {
    return {
        $container: pod,
        $type: ast.PodController,
        id: 'PodController',
        name: name ? getControllerName(name) : 'RC'
    };
}

export function createPodCardinalityNode(pod: ast.PodNode, name?: string): ast.PodCardinality {
    return {
        $container: pod,
        $type: ast.PodCardinality,
        id: 'PodCardinality',
        name: name ? name : '1'
    };
}

export function createPortNode(container: ast.PodNode | ast.ServiceNode, number?: number, name?: string): ast.PortNode {
    return {
        $type: ast.PortNode,
        $container: container,
        id: 'Port' + container.ports.length,
        name: name ? name : 'PortNode' + container.ports.length,
        number: number ? number : 8080
    };
}

export enum VolumeType {
    Secret = 'secret',
    ConfigMap = 'configmap'
}
export function createVolumeNode(container: ast.PodNode, name?: string, type?: VolumeType): ast.VolumeNode {
    return {
        $type: ast.VolumeNode,
        $container: container,
        id: 'Volume' + container.volumes.length,
        name: name ? name : 'Volume' + container.volumes.length,
        type: type ? type : 'secret'
    };
}


export function getNodeDimensions(node: ast.NodeType, kdlDiagram: ast.KDLDiagram): ast.Dimensions | undefined {
    const nodeAttribute = kdlDiagram.diagram?.nodeAttributes.find(nodeAttribute => nodeAttribute?.nodeID.ref == node);
    return nodeAttribute?.dimensions;
}
