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

export function getNodeDimensions(node: ast.NodeType, kdlDiagram: ast.KDLDiagram): ast.Dimensions | undefined {
    const nodeAttribute = kdlDiagram.diagram?.nodeAttributes.find(nodeAttribute => nodeAttribute?.nodeID.ref == node);
    return nodeAttribute?.dimensions;
}
