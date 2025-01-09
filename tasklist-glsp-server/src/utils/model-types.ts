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
export namespace ModelTypes {
    export const TASK = 'task';
    export const CLUSTER = 'cluster';
    export const INGRESS = 'ingress';
    export const LABEL_HEADING = 'label:heading';
    export const LABEL_TEXT = 'label:text';
    export const COMP_HEADER = 'comp:header';
    export const STRUCTURE = 'struct';
    export const INGRESS_BODY = 'ingress:body';
    export const POD = 'pod';
    export const SERVICE = 'service';

    export function toNodeType(type: string): string {
        switch (type) {
            case CLUSTER:
                return 'cluster';
            case TASK:
                return 'task';
            case INGRESS:
                return 'ingress';
            case POD:
                return 'pod';
            case SERVICE:
                return 'service';
            default:
                return 'unknown';
        }
    }

}
