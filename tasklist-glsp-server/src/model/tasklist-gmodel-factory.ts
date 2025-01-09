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
import { Cluster, Container, Ingress, Pod, Port, Service, Task, Transition } from './tasklist-model';
import { TaskListModelState } from './tasklist-model-state';
import { ModelTypes } from '../utils/model-types';
import { ClusterNode } from './cluster-node';
import { IngressNode } from './ingress-node';
import { PodNode } from './pod-node';
import { ServiceNode } from './service-node';
import { ContainerNode } from './container-node';
import { PortNode } from './port-node';

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
        builder.children();

        return builder.build();
    }

    protected createPodNode(pod: Pod): GCompartment {
        const containerNodes = pod.container_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(container => this.createContainerNode(container as Container));

        const portNodes = pod.port_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(port => this.createPortNode(port as Port));

        const builder = PodNode.builder()
            .type(ModelTypes.POD)
            .position(pod.position)
            .name(pod.name)
            .id(pod.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addContainerNodes(containerNodes)
            .addPortNodes(portNodes);

        if (pod.size) {
            builder.addLayoutOptions({ prefWidth: pod.size.width, prefHeight: pod.size.height });
        }
        return builder.build();
    }

    protected createServiceNode(service: Service): GCompartment {
        const portNodes = service.port_ids
            .map(id => this.modelState.index.findElement(id))
            .filter(e => e !== undefined)
            .map(port => this.createPortNode(port as Port));

        const builder = ServiceNode.builder()
            .type(ModelTypes.SERVICE)
            .position(service.position)
            .name(service.name)
            .id(service.id)
            .addArgs(ArgsUtil.cornerRadius(50))
            .children()
            .addPortNodes(portNodes);

        if (service.size) {
            builder.addLayoutOptions({ prefWidth: service.size.width, prefHeight: service.size.height });
        }
        return builder.build();
    }

    protected createContainerNode(container: Container): GCompartment {
        const builder = ContainerNode.builder()
            .type(ModelTypes.CONTAINER)
            .position(container.position)
            .name(container.name)
            .id(container.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (container.size) {
            builder.addLayoutOptions({ prefWidth: container.size.width, prefHeight: container.size.height });
        }
        return builder.build();
    }

    protected createPortNode(port: Port): GCompartment {
        const builder = PortNode.builder()
            .type(ModelTypes.PORT)
            .position(port.position)
            .name(port.name)
            .number(port.number)
            .id(port.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children();

        if (port.size) {
            builder.addLayoutOptions({ prefWidth: port.size.width, prefHeight: port.size.height });
        }
        return builder.build();
    }
}
