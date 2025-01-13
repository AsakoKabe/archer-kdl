/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import { Action, IActionHandler, ResponseAction } from '@eclipse-glsp/client';
import { injectable } from 'inversify';


@injectable()
export class MyCustomResponseActionHandler implements IActionHandler {
  handle(action: MyCustomResponseAction): void | Action {
    // implement your custom logic to handle the action
    // Optionally issue a response action
  }
}

export interface MyCustomResponseAction extends ResponseAction {
    kind: typeof MyCustomResponseAction.KIND;
}

export namespace MyCustomResponseAction {
    export const KIND = 'myCustomResponse';

    export function is(object: any): object is MyCustomResponseAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { responseId?: string } = {}): MyCustomResponseAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}