import {
    DefaultTypes,
    DiagramConfiguration,
    EdgeTypeHint,
    GCompartment,
    getDefaultMapping,
    GLabel,
    GModelElement,
    GModelElementConstructor,
    ServerLayoutKind,
    ShapeTypeHint
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ClusterNode } from '../model/cluster-node';
import { ContainerNode } from '../model/container-node';
import { IngressNode } from '../model/ingress-node';
import { PodNode } from '../model/pod-node';
import { PortNode } from '../model/port-node';
import { ServiceNode } from '../model/service-node';
import { ModelTypes } from '../utils/model-types';

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
        mapping.set(ModelTypes.CLUSTER, ClusterNode);
        mapping.set(ModelTypes.STRUCTURE, GCompartment);
        mapping.set(ModelTypes.INGRESS, IngressNode);
        mapping.set(ModelTypes.POD, PodNode);
        mapping.set(ModelTypes.SERVICE, ServiceNode);
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
                elementTypeId: ModelTypes.CLUSTER,
                containableElementTypeIds: [ModelTypes.INGRESS, ModelTypes.POD, ModelTypes.SERVICE]
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.INGRESS,
                containableElementTypeIds: []
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.POD,
                containableElementTypeIds: [ModelTypes.CONTAINER, ModelTypes.PORT]
            }),
            createDefaultShapeTypeHint({
                elementTypeId: ModelTypes.SERVICE,
                containableElementTypeIds: [ModelTypes.PORT]
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
