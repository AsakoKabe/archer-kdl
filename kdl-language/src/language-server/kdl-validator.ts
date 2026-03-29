/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/
import { ValidationAcceptor, ValidationChecks } from 'langium';
import { Diagnostic } from 'vscode-languageserver-protocol';
import { KDLAstType, KDLDiagram, NamespaceNode } from './generated/ast.js';
import type { KDLServices } from './kdl-module.js';
import { IngressValidator } from './validators/ingress-validator.js';
import { ServiceValidator } from './validators/service-validator.js';
import { PodValidator } from './validators/pod-validator.js';

export namespace KDLIssueCodes {
    export const FilenameNotMatching = 'filename-not-matching';
}

export interface FilenameNotMatchingDiagnostic extends Diagnostic {
    data: {
        code: typeof KDLIssueCodes.FilenameNotMatching;
    };
}

export namespace FilenameNotMatchingDiagnostic {
    export function is(diagnostic: Diagnostic): diagnostic is FilenameNotMatchingDiagnostic {
        return diagnostic.data?.code === KDLIssueCodes.FilenameNotMatching;
    }
}

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: KDLServices): void {
    const registry = services.validation.ValidationRegistry;
    const kuberValidator = services.validation.KubeValidator;

    const checks: ValidationChecks<KDLAstType> = {
        NamespaceNode: kuberValidator.checkNamespaceNode,
        KDLDiagram: kuberValidator.checkKdlDiagram
    };
    registry.register(checks, kuberValidator);
}

export class KubeValidator {
    constructor(protected services: KDLServices) {}

    async checkNamespaceNode(namespaceNode: NamespaceNode, accept: ValidationAcceptor): Promise<void> {
        const kubeNamespaces = await this.services.api.Kube.getNamespaces();
        if (!kubeNamespaces.includes(namespaceNode.name)) {
            accept('warning', `Namespace "${namespaceNode.name}" is not found in Kubernetes cluster.`, {
                node: namespaceNode,
                keyword: 'name'
            });
        }

        await IngressValidator.validateIngresses(namespaceNode, accept, this.services);
        await ServiceValidator.validateServices(namespaceNode, accept, this.services);
        await PodValidator.validate(namespaceNode, accept, this.services);
    }

    async checkKdlDiagram(kdlDiagram: KDLDiagram, accept: ValidationAcceptor): Promise<void> {
        const kubeNamespaces = await this.services.api.Kube.getNamespaces();
        const modelNamespaces = kdlDiagram.namespaces.map(ns => ns.name);
        for (const kubeNamespace of kubeNamespaces) {
            if (!modelNamespaces.includes(kubeNamespace)) {
                accept('warning', `Namespace "${kubeNamespace}" is not found in KDL model.`, {
                    node: kdlDiagram,
                    keyword: 'namespaces'
                });
            }
        }
    }
}
