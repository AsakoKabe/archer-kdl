import { Dimension, Point } from '@eclipse-glsp/server';
import * as ast from '../../../language-server/generated/ast.js';
import { IdProvider } from '../../../language-server/kdl-naming.js';

export function createEdgeID(sourceID: string, targetID: string): string {
    return `${sourceID}-${targetID}`.replaceAll('.', '_');
}

export function addNodeAttribute(kdlDiagram: ast.KDLDiagram, idProvider: IdProvider, node: ast.NodeType, location?: Point) {
    kdlDiagram.diagram!.nodeAttributes.push(createNodeAttribute(kdlDiagram, idProvider, node, location));
}

export function createNodeAttribute(
    kdlDiagram: ast.KDLDiagram,
    idProvider: IdProvider,
    node: ast.NodeType,
    location?: Point,
    dim?: Dimension
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
        width: dim ? dim.width : 10,
        height: dim ? dim.height : 10,
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
        },
        points: []
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

export function createPodNode(cluster: ast.ClusterNode, name?: string, controller?: string, replicaFactor?: string): ast.PodNode {
    const pod: ast.PodNode = {
        $type: ast.PodNode,
        $container: cluster,
        id: 'PodNode' + cluster.pods.length,
        name: name ? name : 'PodNode' + cluster.pods.length,
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
    Secret='secret',
    ConfigMap='configmap'
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

export function createServiceNode(cluster: ast.ClusterNode, name?: string, type?: string): ast.ServiceNode {
    const service: ast.ServiceNode = {
        $type: ast.ServiceNode,
        $container: cluster,
        id: 'ServiceNode' + cluster.services.length,
        name: name ? name : 'ServiceNode' + cluster.services.length,
        type: {} as ast.ServiceTypeNode,
        ports: [],
        links: []
    };
    service.type = createServiceTypeNode(service, type);
    return service;
}

function getServiceTypeName(name: string): string {
    switch (name) {
        case 'ClusterIP':
            return 'CIP';
        case 'NodePort':
            return 'NP';
        case 'LoadBalancer':
            return 'LB';
        case 'ExternalIP':
            return 'EIP';
        default:
            return name;
    }
}
export function createServiceTypeNode(service: ast.ServiceNode, name?: string): ast.ServiceTypeNode {
    return {
        $container: service,
        $type: ast.ServiceTypeNode,
        id: 'ServiceType',
        name: name ? getServiceTypeName(name) : 'Not found'
    };
}

export function getNodeDimensions(node: ast.NodeType, kdlDiagram: ast.KDLDiagram): ast.Dimensions | undefined {
    const nodeAttribute = kdlDiagram.diagram?.nodeAttributes.find(nodeAttribute => nodeAttribute?.nodeID.ref == node);
    return nodeAttribute?.dimensions;
}
