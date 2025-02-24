/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
    DefaultTypes,
    DiagramConfiguration,
    EdgeTypeHint,
    GCompartment,
    GLabel,
    GModelElement,
    GModelElementConstructor,
    ServerLayoutKind,
    ShapeTypeHint,
    getDefaultMapping
} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { injectable } from 'inversify';
import { ContainerNode } from './model/graph-extension/container-node.js';
import { IngressNode } from './model/graph-extension/ingress-node.js';
import { NamespaceNode } from './model/graph-extension/namespace-node.js';
import { PodCardinalityNode } from './model/graph-extension/pod-cardinality-node.js';
import { PodControllerNode } from './model/graph-extension/pod-controller-node.js';
import { PodNode } from './model/graph-extension/pod-node.js';
import { PortNode } from './model/graph-extension/port-node.js';
import { ServiceNode } from './model/graph-extension/service-node.js';
import { ServiceTypeNode } from './model/graph-extension/service-type-node.js';
import { VolumeNode } from './model/graph-extension/volume-node.js';

@injectable()
export class KDLDiagramConfiguration implements DiagramConfiguration {
    layoutKind = ServerLayoutKind.MANUAL;
    needsClientLayout = true;
    animatedUpdate = true;

    get typeMapping(): Map<string, GModelElementConstructor<GModelElement>> {
        const mapping = getDefaultMapping();
        mapping.set(ModelTypes.LABEL_HEADING, GLabel);
        mapping.set(ModelTypes.LABEL_TEXT, GLabel);
        mapping.set(ModelTypes.COMP_HEADER, GCompartment);
        mapping.set(ModelTypes.COMP_COMP, GCompartment);
        mapping.set(ModelTypes.STRUCTURE, GCompartment);
        mapping.set(ModelTypes.NAMESPACE, NamespaceNode);
        mapping.set(ModelTypes.INGRESS, IngressNode);
        mapping.set(ModelTypes.POD, PodNode);
        mapping.set(ModelTypes.POD_CONTROLLER, PodControllerNode);
        mapping.set(ModelTypes.POD_CARDINALITY, PodCardinalityNode);
        mapping.set(ModelTypes.VOLUME, VolumeNode);
        mapping.set(ModelTypes.SERVICE, ServiceNode);
        mapping.set(ModelTypes.SERVICE_TYPE, ServiceTypeNode);
        mapping.set(ModelTypes.CONTAINER, ContainerNode);
        mapping.set(ModelTypes.PORT, PortNode);
        return mapping;
    }

    get shapeTypeHints(): ShapeTypeHint[] {
        return [
            {
                elementTypeId: DefaultTypes.NODE,
                deletable: true,
                reparentable: false,
                repositionable: true,
                resizable: true
            },
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.NAMESPACE,
                containableElementTypeIds: [ModelTypes.INGRESS, ModelTypes.POD, ModelTypes.SERVICE]
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.INGRESS,
                containableElementTypeIds: []
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.SERVICE,
                containableElementTypeIds: [ModelTypes.PORT, ModelTypes.SERVICE_TYPE]
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.SERVICE_TYPE
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.POD,
                containableElementTypeIds: [
                    ModelTypes.CONTAINER,
                    ModelTypes.PORT,
                    ModelTypes.POD_CARDINALITY,
                    ModelTypes.POD_CONTROLLER,
                    ModelTypes.VOLUME
                ]
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.POD_CARDINALITY
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.POD_CONTROLLER
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.VOLUME
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.CONTAINER,
                containableElementTypeIds: []
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.PORT,
                containableElementTypeIds: []
            })
        ];
    }

    get edgeTypeHints(): EdgeTypeHint[] {
        return [
            {
                elementTypeId: DefaultTypes.EDGE,
                deletable: true,
                repositionable: true,
                routable: true,
                sourceElementTypeIds: [ModelTypes.SERVICE, ModelTypes.INGRESS, ModelTypes.CONTAINER],
                targetElementTypeIds: [ModelTypes.PORT]
            }
        ];
    }
}
export function createDefaultShapeTypeHint(template: { elementTypeId: string } & Partial<ShapeTypeHint>): ShapeTypeHint;
export function createDefaultShapeTypeHint(elementId: string): ShapeTypeHint;
export function createDefaultShapeTypeHint(
    elementIdOrTemplate: string | ({ elementTypeId: string } & Partial<ShapeTypeHint>)
): ShapeTypeHint {
    const template = typeof elementIdOrTemplate === 'string' ? { elementTypeId: elementIdOrTemplate } : elementIdOrTemplate;
    return { repositionable: true, deletable: true, resizable: true, reparentable: true, ...template };
}
