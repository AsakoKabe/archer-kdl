/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
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
import { ModelTypes } from '../utils/model-types';
import { ClusterNode } from '../model/cluster-node';

@injectable()
export class TaskListDiagramConfiguration implements DiagramConfiguration {
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
                containableElementTypeIds: [ModelTypes.TASK, ModelTypes.CLUSTER]
            })
        ];
    }


    get edgeTypeHints(): EdgeTypeHint[] {
        return [
            {
                elementTypeId: DefaultTypes.EDGE,
                deletable: true,
                repositionable: false,
                routable: false,
                sourceElementTypeIds: [DefaultTypes.NODE],
                targetElementTypeIds: [DefaultTypes.NODE]
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

