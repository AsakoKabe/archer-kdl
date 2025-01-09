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
import { Cluster, Service } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';
import { ModelTypes } from '../utils/model-types';
import { ServiceNode, ServiceNodeBuilder } from '../model/service-node';

@injectable()
export class CreateServiceHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.SERVICE];
    label = 'Service';

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof ServiceNode) {
            const structComp = this.getServiceCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getServiceCompartment(service: ServiceNode): GCompartment | undefined {
        return service.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        if (!operation.containerId) {
            throw new GLSPServerError("Service can't be outside cluster");
        }
        const serviceNode = this.builder(relativeLocation).build();
        const parent = this.modelState.index.findElement(operation.containerId);
        if (Cluster.is(parent)) {
            parent.service_ids.push(serviceNode.id);
        }
        this.modelState.sourceModel.services.push(Service.createFromNode(serviceNode));
        return serviceNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): ServiceNodeBuilder {
        return (
            ServiceNode.builder()
                .type(elementTypeId)
                .position(point)
                // .size(100, 100)
                .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(ServiceNode).length)
                .addArgs(ArgsUtil.cornerRadius(50))
                .children()
                .nodeType(ModelTypes.SERVICE)
        );
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
