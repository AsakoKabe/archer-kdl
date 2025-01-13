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

import { Action, ActionHandler, MaybePromise, RequestAction, ResponseAction } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../kuber/client';
 
export interface KuberRecoverRequestAction extends RequestAction<KuberRecoverResponseAction> {
    kind: typeof KuberRecoverRequestAction.KIND;
}

export namespace KuberRecoverRequestAction {
    export const KIND = 'kuberRecoverKind';
    export function is(object: any): object is KuberRecoverRequestAction {
      return (RequestAction.hasKind(object, KIND));
    }
    export function create(options: {requestId?: string }): KuberRecoverRequestAction {
      return {
          kind: KIND,
          requestId: '',
          ...options
      };
    }
}

export interface KuberRecoverResponseAction extends ResponseAction {
    kind: typeof KuberRecoverResponseAction.KIND;
}

export namespace KuberRecoverResponseAction {
    export const KIND = 'kuberRecoverResponse';

    export function is(object: any): object is KuberRecoverResponseAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { responseId?: string } = {}): KuberRecoverResponseAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}

@injectable()
export class KuberRecoverActionHandler implements ActionHandler {
  actionKinds = [KuberRecoverRequestAction.KIND];

  @inject(KuberClient)
  protected kuberClient: KuberClient;

  execute(action: KuberRecoverRequestAction): MaybePromise<Action[]> {
    // implement your custom logic to handle the action

    // Finally issue response actions
    // If no response actions should be issued '[]' can be used;
    // console.error('MyCustomActionHandler');
    this.kuberClient.ping();
    return [];
  }
}