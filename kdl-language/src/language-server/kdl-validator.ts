/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { Diagnostic } from 'vscode-languageserver-protocol';
import { isKDLDiagram, KDLAstType } from './generated/ast.js';
import type { KDLServices } from './kdl-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './kdl-naming.js';

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
    const validator = services.validation.CrossModelValidator;

    const checks: ValidationChecks<KDLAstType> = {
        AstNode: validator.checkNode
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class KDLValidator {
    constructor(protected services: KDLServices) {}

    checkNode(node: AstNode, accept: ValidationAcceptor): void {
        this.checkUniqueGlobalId(node, accept);
        this.checkUniqueNodeId(node, accept);
        // this.deleteUnusedDiagram(node, accept);
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
                Array.of<IdentifiableAstNode>(
                    // ...node.model.clusters,
                    // ...node.model.ingresses,
                    // ...node.model.services,
                    // ...node.model.services.flatMap(s => s.ports),
                    // ...node.model.pods,
                    // ...node.model.pods.flatMap(p => p.ports),
                    // ...node.model.containers,
                    // ...node.diagram.edgeAttributes
                ),
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
