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
import { Cluster, Ingress, Pod, Service, Task, Transition } from './tasklist-model';
import { TaskListModelState } from './tasklist-model-state';
import { ModelTypes } from '../utils/model-types';
import { ClusterNode } from './cluster-node';
import { IngressNode } from './ingress-node';
import { PodNode } from './pod-node';
import { ServiceNode } from './service-node';

@injectable()
export class TaskListGModelFactory implements GModelFactory {
    @inject(TaskListModelState)
    protected modelState: TaskListModelState;

    createModel(): void {
        const taskList = this.modelState.sourceModel;
        this.modelState.index.indexTaskList(taskList);
        const childNodes = taskList.tasks.map(task => this.createTaskNode(task));
        const childEdges = taskList.transitions.map(transition => this.createTransitionEdge(transition));
        const clusterNodes = taskList.clusters.map(cluster => this.createClusterNode(cluster));
        const newRoot = GGraph.builder() //
            .id(taskList.id)
            .addChildren(childNodes)
            .addChildren(childEdges)
            .addChildren(clusterNodes)
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
        return GEdge.builder()
            .id(transition.id)
            .addCssClass('tasklist-transition')
            .sourceId(transition.sourceTaskId)
            .targetId(transition.targetTaskId)
            .build();
    }

    protected createClusterNode(cluster: Cluster): GCompartment {
        const ingressNodes = cluster.ingress_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(ingress => this.createIngressNode(ingress as Ingress));

        const podNodes = cluster.pod_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(pod => this.createPodNode(pod as Pod));

        const serviceNodes = cluster.service_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(service => this.createServiceNode(service as Service));

        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .position(cluster.position)
            .name(cluster.name)
            .id(cluster.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addIngressNodes(ingressNodes)
            .addPodNodes(podNodes)
            .addServiceNodes(serviceNodes);

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
            .id(ingress.id);

        if (ingress.size) {
            builder.addLayoutOptions({ prefWidth: ingress.size.width, prefHeight: ingress.size.height });
        }
        if (ingress.host){
            builder.host(ingress.host);
        }
        return builder.children().build();
    }

    protected createPodNode(pod: Pod): GCompartment {
        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .position(pod.position)
            .name(pod.name)
            .id(pod.id)
            .addArgs(ArgsUtil.cornerRadius(5));

        if (pod.size) {
            builder.addLayoutOptions({ prefWidth: pod.size.width, prefHeight: pod.size.height });
        }
        return builder.children().build();
    }

    protected createServiceNode(service: Service): GCompartment {
        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .position(service.position)
            .name(service.name)
            .id(service.id)
            .addArgs(ArgsUtil.cornerRadius(50));

        if (service.size) {
            builder.addLayoutOptions({ prefWidth: service.size.width, prefHeight: service.size.height });
        }
        return builder.children().build();
    }
}
