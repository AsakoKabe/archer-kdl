/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import {
    ArgsUtil,
    CreateNodeOperation,
    GCompartment,
    GhostElement,
    GLSPServerError,
    GModelCreateNodeOperationHandler,
    GModelElement,
    GNode,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { Pod, Port, Service  } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';
import { ModelTypes } from '../utils/model-types';
import { PortNode, PortNodeBuilder } from '../model/port-node';

@injectable()
export class CreatePortHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.PORT];
    label = 'Port';

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof PortNode) {
            const structComp = this.getPortCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getPortCompartment(port: PortNode): GCompartment | undefined {
        return port.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const portNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Pod.is(parent) || Service.is(parent)) {
            parent.port_ids.push(portNode.id);
        }
        this.modelState.sourceModel.ports.push(Port.createFromNode(portNode));
        return portNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): PortNodeBuilder {
        return (
            PortNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(PortNode).length)
                .number('8080')
                .addArgs(ArgsUtil.cornerRadius(5))
                .children()
                .nodeType(ModelTypes.PORT)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
