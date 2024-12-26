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
import { DefaultModelState, JsonModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelIndex } from './kdl-model-index';
import { TaskList } from './tasklist-model';

@injectable()
export class KDLModelState extends DefaultModelState implements JsonModelState<TaskList> {
    @inject(KDLModelIndex)
    override readonly index: KDLModelIndex;

    protected _taskList: TaskList;

    get sourceModel(): TaskList {
        return this._taskList;
    }

    updateSourceModel(taskList: TaskList): void {
        this._taskList = taskList;
        this.index.indexTaskList(taskList);
    }
}
