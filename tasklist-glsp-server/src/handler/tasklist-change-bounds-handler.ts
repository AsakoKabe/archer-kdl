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

import {
    ChangeBoundsOperation,
    ChangeContainerOperation,
    Command,
    Dimension,
    ElementAndBounds,
    hasArrayProp,
    // GCompartment,
    // GNode,
    // GNode,
    JsonOperationHandler,
    MaybePromise,
    Operation,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelState } from '../model/tasklist-model-state';
import { ModelTypes } from '../utils/model-types';

@injectable()
export class TaskListChangeBoundsHandler extends JsonOperationHandler {
    readonly elementTypeIds = [ModelTypes.CLUSTER];

    readonly operationType = ChangeBoundsOperation.KIND;

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: ChangeBoundsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.newBounds.forEach(element => this.changeElementBounds(element.elementId, element.newSize, element.newPosition));
        });
    }

    protected changeElementBounds(elementId: string, newSize: Dimension, newPosition?: Point): void {
        console.error(elementId);
        const index = this.modelState.index;
        const box = index.findBoxes(elementId);
        if (box) {
            box.size = newSize;
            if (newPosition) {
                box.position = newPosition;
            }
        }
    }
}

@injectable()
export class ContainerChangeHandler extends JsonOperationHandler {
    readonly operationType = ChangeContainerOperation.KIND;

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: ChangeContainerOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            console.error(operation);
        });
    }
}

export interface IntersectContainerOperation extends Operation {
    kind: typeof IntersectContainerOperation.KIND;

    newBounds: ElementAndBounds[];
    containerId?: string;
}

export namespace IntersectContainerOperation {
    export const KIND = 'changeBounds';

    export function is(object: unknown): object is IntersectContainerOperation {
        return Operation.hasKind(object, KIND) && hasArrayProp(object, 'newBounds') && hasArrayProp(object, 'containerId');
    }

    export function create(newBounds: ElementAndBounds[], options: { containerId?: string }): IntersectContainerOperation {
        return {
            kind: KIND,
            isOperation: true,
            newBounds,
            ...options
        };
    }
}
