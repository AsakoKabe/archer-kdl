/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import * as k8s from '@kubernetes/client-node';
import { ValidationAcceptor } from 'langium';
import { IngressNode, NamespaceNode } from '../generated/ast.js';
import type { KDLServices } from '../kdl-module.js';

export namespace IngressValidator {
    export async function validateIngresses(
        namespaceNode: NamespaceNode,
        accept: ValidationAcceptor,
        services: KDLServices
    ): Promise<void> {
        const kubeIngresses = await services.api.Kube.getIngresses(namespaceNode.name);
        addIngressNotFoundMarkers(kubeIngresses, namespaceNode, accept);
        namespaceNode.ingresses.map(ingress => validateIngress(ingress, kubeIngresses, accept));
    }

    export function addIngressNotFoundMarkers(
        kubeIngresses: k8s.V1Ingress[],
        modelNamespace: NamespaceNode,
        accept: ValidationAcceptor
    ): void {
        kubeIngresses.forEach(kubeIngress => {
            const kubeIngressName = kubeIngress.metadata?.name;
            if (!kubeIngressName) {
                return;
            }
            if (!modelNamespace.ingresses.map(ingressNode => ingressNode.name).includes(kubeIngressName)) {
                if (modelNamespace.ingresses.length){
                    accept('warning', `Ingress "${kubeIngressName}" is not found in the model.`, {
                        node: modelNamespace,
                        keyword: 'ingresses'
                    });
                } else {
                    accept('warning', `Ingress "${kubeIngressName}" is not found in the model.`, {
                        node: modelNamespace,
                        keyword: 'name'
                    });
                }
            }
        });
    }

    export function validateIngress(ingress: IngressNode, clusterIngresses: k8s.V1Ingress[], accept: ValidationAcceptor): void {
        const clusterIngress = clusterIngresses.find(clusterIngress => clusterIngress.metadata?.name === ingress.name);
        if (!clusterIngress) {
            accept('warning', `Ingress "${ingress.name}" not found in cluster.`, { node: ingress, property: 'name' });
            return;
        }

        const hosts = clusterIngress.spec?.rules?.map(rule => rule.host);
        if (!hosts || !hosts.includes(ingress.host)) {
            if (ingress.host) {
                accept('warning', `Host "${ingress.host}" not found in cluster hosts "${hosts}".`, {
                    node: ingress,
                    property: 'host'
                });
            } else {
                accept('warning', `Host "${ingress.host}" not found in cluster hosts "${hosts}".`, {
                    node: ingress,
                    property: 'name'
                });
            }
        }
    }
}
