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

import { injectable } from 'inversify';
import * as k8s from '@kubernetes/client-node';

@injectable()
export class KuberClient {
    protected kc: k8s.KubeConfig;
    protected k8sApi: k8s.CoreV1Api;

    constructor() {
        this.kc = new k8s.KubeConfig();
        this.kc.loadFromDefault();
        this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    }

    public async ping(): Promise<void> {
        try {
            const pods = await this.k8sApi.listNamespacedPod({ namespace: 'default' });
            console.error('Pods: ', pods.items);
        } catch (err) {
            console.error(err);
        }
        // console.error('ping');
    }
}
