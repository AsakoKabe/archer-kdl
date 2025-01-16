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
import { GModelIndex } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { KDLBaseElement, KDLShapeElement, Link, Port, Service, TaskList } from './tasklist-model';

@injectable()
export class TaskListModelIndex extends GModelIndex {
    protected idToTaskListElements = new Map<string, KDLBaseElement>();

    indexTaskList(taskList: TaskList): void {
        this.idToTaskListElements.clear();
        for (const element of [
            ...taskList.clusters,
            ...taskList.ingresses,
            ...taskList.pods,
            ...taskList.services,
            ...taskList.containers,
            ...taskList.ports,
            ...taskList.links
        ]) {
            this.idToTaskListElements.set(element.id, element);
        }
    }

    // findTask(id: string): Task | undefined {
    //     const element = this.findTaskOrTransition(id);
    //     return Task.is(element) ? element : undefined;
    // }

    findTransition(id: string): Link | undefined {
        const element = this.findElement(id);
        return Link.is(element) ? element : undefined;
    }

    // findTaskOrTransition(id: string): Task | Transition | undefined {
    //     return this.idToTaskListElements.get(id);
    // }

    findElement(id: string): KDLBaseElement | undefined {
        return this.idToTaskListElements.get(id);
    }

    findPort(id: string): Port | undefined {
        const element = this.findElement(id);
        return Port.is(element) ? element : undefined;
    }

    findService(id: string): Service | undefined {
        const element = this.findElement(id);
        return Service.is(element) ? element : undefined;
    }

    findBoxes(id: string): KDLShapeElement | undefined {
        const element = this.findElement(id);
        return KDLShapeElement.is(element) ? element : undefined;
    }
}
