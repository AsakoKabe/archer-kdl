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
import { ArgsUtil, GCompartment, GEdge, GGraph, GLabel, GModelFactory, GNode } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { Cluster, Ingress, Task, TaskList, Transition } from './tasklist-model';
import { TaskListModelState } from './tasklist-model-state';
import { ModelTypes } from '../utils/model-types';
import { ClusterNode } from './cluster-node';
import { IngressNode } from './ingress-node';

@injectable()
export class TaskListGModelFactory implements GModelFactory {
    @inject(TaskListModelState)
    protected modelState: TaskListModelState;

    createModel(): void {
        const taskList = this.modelState.sourceModel;
        this.modelState.index.indexTaskList(taskList);
        const childNodes = taskList.tasks.map(task => this.createTaskNode(task));
        const childEdges = taskList.transitions.map(transition => this.createTransitionEdge(transition));
        const clusterNodes = taskList.clusters.map(cluster => this.createClusterNode(cluster, taskList));
        const ingressNodes = taskList.ingresses.map(ingress => this.createIngressNode(ingress));
        const newRoot = GGraph.builder() //
            .id(taskList.id)
            .addChildren(childNodes)
            .addChildren(childEdges)
            .addChildren(clusterNodes)
            .addChildren(ingressNodes)
            .build();
        this.modelState.updateRoot(newRoot);
    }

    protected createTaskNode(task: Task): GNode {
        const builder = GNode.builder()
            .id(task.id)
            .addCssClass('tasklist-node')
            .add(GLabel.builder().text(task.name).id(`${task.id}_label`).build())
            .layout('hbox')
            .addLayoutOption('paddingLeft', 5)
            .position(task.position);

        if (task.size) {
            builder.addLayoutOptions({ prefWidth: task.size.width, prefHeight: task.size.height });
        }

        return builder.build();
    }

    protected createTransitionEdge(transition: Transition): GEdge {
        return GEdge.builder() //
            .id(transition.id)
            .addCssClass('tasklist-transition')
            .sourceId(transition.sourceTaskId)
            .targetId(transition.targetTaskId)
            .build();
    }

    protected createClusterNode(cluster: Cluster, taskList: TaskList): GCompartment {
        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .position(cluster.position)
            .name(cluster.name)
            .id(cluster.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (cluster.size) {
            builder.addLayoutOptions({ prefWidth: cluster.size.width, prefHeight: cluster.size.height });
        }
        return builder.build();
    }

    protected createIngressNode(ingress: Ingress): GCompartment {
        const builder = IngressNode.builder()
            .type(ModelTypes.INGRESS)
            .position(ingress.position)
            .name(ingress.name)
            .id(ingress.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (ingress.size) {
            builder.addLayoutOptions({ prefWidth: ingress.size.width, prefHeight: ingress.size.height });
        }
        return builder.build();
    }
}
