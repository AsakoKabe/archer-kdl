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
import { ApplyLabelEditOperation } from '@eclipse-glsp/protocol';
import { Command, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server/node';
import { inject, injectable } from 'inversify';
import { Cluster, Container, Ingress, Pod, Port, Service } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';
import { ModelTypes } from '../utils/model-types';

@injectable()
export class TaskListApplyLabelEditHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;

    @inject(TaskListModelState)
    protected override readonly modelState: TaskListModelState;

    override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const labelId = operation.labelId.split('_')[0];
            const labelField = operation.labelId.split('_')[1];
            const parent = this.modelState.index.findElement(labelId);
            if (parent) {
                switch (parent.type) {
                    case ModelTypes.CLUSTER:
                        (parent as Cluster).name = operation.text;
                        break;
                    case ModelTypes.INGRESS:
                        if (labelField === 'name') {
                            (parent as Ingress).name = operation.text;
                        } else if (labelField === 'host') {
                            (parent as Ingress).host = operation.text;
                        }
                        break;
                    case ModelTypes.POD:
                        (parent as Pod).name = operation.text;
                        break;
                    case ModelTypes.SERVICE:
                        (parent as Service).name = operation.text;
                        break;
                    case ModelTypes.CONTAINER:
                        (parent as Container).name = operation.text;
                        break;
                    case ModelTypes.PORT:
                        if (labelField === 'name') {
                            (parent as Port).name = operation.text;
                        } else if (labelField === 'number') {
                            (parent as Port).number = operation.text;
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    }
}
