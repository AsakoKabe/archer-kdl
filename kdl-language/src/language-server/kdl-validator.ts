/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { Diagnostic } from 'vscode-languageserver-protocol';
import { isKDLDiagram, KDLAstType, KDLDiagram, NamespaceNode } from './generated/ast.js';
import type { KDLServices } from './kdl-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './kdl-naming.js';
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
    // const validator = services.validation.CrossModelValidator;
    const kuberValidator = services.validation.KubeValidator;

    const checks: ValidationChecks<KDLAstType> = {
        // AstNode: validator.checkNode,
        NamespaceNode: kuberValidator.checkNamespaceNode,
        KDLDiagram: kuberValidator.checkKdlDiagram
    };
    // registry.register(checks, validator);
    registry.register(checks, kuberValidator);
}

/**
 * Implementation of custom validations.
 */
export class KDLValidator {
    constructor(protected services: KDLServices) {}

    checkNode(node: AstNode, accept: ValidationAcceptor): void {
        this.checkUniqueGlobalId(node, accept);
        this.checkUniqueNodeId(node, accept);
    }

    protected checkUniqueGlobalId(node: AstNode, accept: ValidationAcceptor): void {
        if (!this.isExportedGlobally(node)) {
            return;
        }
        const globalId = this.services.references.IdProvider.getGlobalId(node);
        if (!globalId) {
            accept('error', 'Missing required id field', { node, property: ID_PROPERTY });
            return;
        }
        const allElements = Array.from(this.services.shared.workspace.IndexManager.allElements());
        const duplicates = allElements.filter(description => description.name === globalId);
        if (duplicates.length > 1) {
            accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
        }
    }

    protected isExportedGlobally(node: AstNode): boolean {
        // we export anything with an id from entities and relationships and all root nodes, see CrossModelScopeComputation
        return isKDLDiagram(node);
    }

    protected checkUniqueNodeId(node: AstNode, accept: ValidationAcceptor): void {
        if (isKDLDiagram(node)) {
            this.markDuplicateIds(
                // TODO: FIX ME
                Array.of<IdentifiableAstNode>(),
                // ...node.model.clusters,
                // ...node.model.ingresses,
                // ...node.model.services,
                // ...node.model.services.flatMap(s => s.ports),
                // ...node.model.pods,
                // ...node.model.pods.flatMap(p => p.ports),
                // ...node.model.containers,
                // ...node.diagram.edgeAttributes
                accept
            );
        }
    }

    protected markDuplicateIds(nodes: IdentifiableAstNode[], accept: ValidationAcceptor): void {
        const knownIds: string[] = [];
        for (const node of nodes) {
            if (node.id && knownIds.includes(node.id)) {
                accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
            } else if (node.id) {
                knownIds.push(node.id);
            }
        }
    }
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
