/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ModelTypes } from '@kdl/protocol';
import { DefaultTypes, DiagramConfiguration, EdgeTypeHint, GCompartment, GLabel, GModelElement, GModelElementConstructor, ServerLayoutKind, ShapeTypeHint, getDefaultMapping } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ClusterNode } from './model/cluster-node.js';

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
            }),
        ];
    }

    get edgeTypeHints(): EdgeTypeHint[] {
        return [];
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
