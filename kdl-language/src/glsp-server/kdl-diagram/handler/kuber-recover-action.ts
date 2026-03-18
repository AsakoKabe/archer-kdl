/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { Action, ActionHandler, MaybePromise, ModelSubmissionHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KubeClient } from '../../../kuber/client.js';
import { KDLModelState } from '../model/kdl-state.js';
import { KuberRecoverRequestAction } from './kuber-recover-actions.js';
import { ClusterRecovery } from './recovery/cluster-recovery.js';

@injectable()
export class KuberRecoverActionHandler implements ActionHandler {
    actionKinds = [KuberRecoverRequestAction.KIND];

    @inject(KubeClient)
    protected kuberClient: KubeClient;

    @inject(KDLModelState)
    protected modelState: KDLModelState;

    @inject(ModelSubmissionHandler)
    protected modelSubmissionHandler: ModelSubmissionHandler;

    execute(action: KuberRecoverRequestAction): MaybePromise<Action[]> {
        return this.kuberClient
            .getNamespaces()
            .then(namespaces => new ClusterRecovery(this.kuberClient, this.modelState).recover(namespaces))
            .then(() => {
                return [];
            });
    }
}
