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

import { Command, CreateNodeOperation, GNode, JsonCreateNodeOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { KDLModelState } from '../model/kdl-model-state';
import { Ingress } from '../model/tasklist-model';
import { ModelTypes } from '../utils/model-types';

@injectable()
export class CreateIngressHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = [ModelTypes.INGRESS];

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    get label(): string {
        return 'Ingress';
    }

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const cluster = this.createIngress(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.ingresses.push(cluster);
        });
    }

    protected createIngress(position: Point): Ingress {
        const nodeCounter = this.modelState.index.getAllByClass(GNode).length;
        return {
            id: uuid.v4(),
            name: `NewIngressNode${nodeCounter}`,
            position
        };
    }
}
