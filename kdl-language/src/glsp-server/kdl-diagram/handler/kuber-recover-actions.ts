/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { Action, RequestAction, ResponseAction } from '@eclipse-glsp/server';

export interface KuberRecoverRequestAction extends RequestAction<KuberRecoverResponseAction> {
    kind: typeof KuberRecoverRequestAction.KIND;
}

export namespace KuberRecoverRequestAction {
    export const KIND = 'kuberRecoverKind';
    export function is(object: any): object is KuberRecoverRequestAction {
        return RequestAction.hasKind(object, KIND);
    }
    export function create(options: { requestId?: string }): KuberRecoverRequestAction {
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
