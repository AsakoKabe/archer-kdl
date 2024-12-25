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
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelState } from '../model/tasklist-model-state';
import { Cluster } from '../model/tasklist-model';
import * as uuid from 'uuid';
import { ModelTypes } from '../utils/model-types';

@injectable()
export class CreateClusterHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = [ModelTypes.CLUSTER];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    get label(): string {
        return 'Cluster';
    }

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const cluster = this.createCluster(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.clusters.push(cluster);
        });
    }

    protected createCluster(position: Point): Cluster {
        return {
            id: uuid.v4(),
            name: 'NewCluster',
            position,
            size: { width: 100, height: 100 }
        };
    }
}
