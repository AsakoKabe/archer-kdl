/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ModelFileExtensions } from '@kdl/protocol';
import { AstNode, UriUtils, ValidationAcceptor, ValidationChecks } from 'langium';
import { Diagnostic } from 'vscode-languageserver-protocol';
import {
    isKDLDiagram,
    KDLAstType,
} from './generated/ast.js';
import type { KDLServices } from './kdl-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './kdl-naming.js';
import { findDocument, isSemanticRoot } from './util/ast-util.js';

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
        AstNode: validator.checkNode,
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
        this.checkMatchingFilename(node, accept);
    }

    protected checkMatchingFilename(node: AstNode, accept: ValidationAcceptor): void {
        if (!isSemanticRoot(node)) {
            return;
        }
        if (!node.id) {
            // diagrams may not have ids set and therefore are not required to match the filename
            return;
        }
        const document = findDocument(node);
        if (!document) {
            return;
        }
        const basename = UriUtils.basename(document.uri);
        const extname = ModelFileExtensions.getFileExtension(basename) ?? UriUtils.extname(document.uri);
        const basenameWithoutExt = basename.slice(0, -extname.length);
        if (basenameWithoutExt.toLowerCase() !== node.id.toLocaleLowerCase()) {
            accept('warning', `Filename should match element id: ${node.id}`, {
                node,
                property: ID_PROPERTY,
                data: { code: KDLIssueCodes.FilenameNotMatching }
            });
        }
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
            this.markDuplicateIds(node.clusters, accept);
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
