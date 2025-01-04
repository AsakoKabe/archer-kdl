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
    GModelCreateNodeOperationHandler,
    GModelElement,
    GNode,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ClusterNode, ClusterNodeBuilder } from '../model/cluster-node';
import { ModelTypes } from '../utils/model-types';
import { TaskListModelState } from '../model/tasklist-model-state';
import { Cluster } from '../model/tasklist-model';

@injectable()
export class CreateClusterHandler extends GModelCreateNodeOperationHandler {
    elementTypeIds = [ModelTypes.CLUSTER];
    label = 'Cluster';

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    // override getLocation(operation: CreateNodeOperation): Point | undefined {
    //     return GridSnapper.snap(operation.location);
    // }

    override getContainer(operation: CreateNodeOperation): GModelElement | undefined {
        const container = super.getContainer(operation);

        if (container instanceof ClusterNode) {
            const structComp = this.getClusterCompartment(container);
            if (structComp) {
                return structComp;
            }
        }
        return container;
    }

    getClusterCompartment(cluster: ClusterNode): GCompartment | undefined {
        return cluster.children
            .filter(child => child instanceof GCompartment)
            .map(child => child as GCompartment)
            .find(comp => ModelTypes.STRUCTURE === comp.type);
    }

    createNode(operation: CreateNodeOperation, relativeLocation?: Point): GNode {
        const clusterNode = this.builder(relativeLocation).build();
        this.modelState.sourceModel.clusters.push(Cluster.createFromNode(clusterNode));
        return clusterNode;
    }

    protected builder(point: Point = Point.ORIGIN, elementTypeId = this.elementTypeIds[0]): ClusterNodeBuilder {
        return ClusterNode.builder()
            .type(elementTypeId)
            .position(point)
            .size(100, 100)
            .name(this.label.replace(' ', '') + this.modelState.index.getAllByClass(ClusterNode).length)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .nodeType(ModelTypes.CLUSTER);
    }

    override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
        return { template: this.serializer.createSchema(this.builder(undefined, elementTypeId).build()) };
    }
}
