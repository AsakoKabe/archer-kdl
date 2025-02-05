/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, AstUtils, LangiumDocument, isAstNode } from 'langium';
import { KDLRoot, isKDLRoot, KDLDiagram, isKDLDiagram } from '../generated/ast.js';
import { ID_PROPERTY } from '../kdl-naming.js';

export type SemanticRoot = KDLDiagram;

export const IMPLICIT_ATTRIBUTES_PROPERTY = '$attributes';
export const IMPLICIT_OWNER_PROPERTY = '$owner';

export const IMPLICIT_ID_PROPERTY = '$id';
export function getAttributes<T>(node: any): T[] {
    return (node[IMPLICIT_ATTRIBUTES_PROPERTY] as T[]) ?? [];
}

export function getOwner<T>(node: any): T | undefined {
    return node?.[IMPLICIT_OWNER_PROPERTY] as T;
}
export function setOwner<T>(attribute: T, owner: object): T {
    (attribute as any)[IMPLICIT_OWNER_PROPERTY] = owner;
    return attribute;
}

export function setImplicitId(node: any, id: string): void {
    node[ID_PROPERTY] = id;
    node[IMPLICIT_ID_PROPERTY] = true;
}

export function removeImplicitProperties(node: any): void {
    delete node[IMPLICIT_ATTRIBUTES_PROPERTY];
    delete node[IMPLICIT_OWNER_PROPERTY];
    if (node[IMPLICIT_ID_PROPERTY] === true) {
        delete node[ID_PROPERTY];
        delete node[IMPLICIT_ID_PROPERTY];
    }
}

export function isImplicitProperty(prop: string, obj: any): boolean {
    return (
        prop === IMPLICIT_ATTRIBUTES_PROPERTY ||
        prop === IMPLICIT_OWNER_PROPERTY ||
        prop === IMPLICIT_ID_PROPERTY ||
        (obj[IMPLICIT_ID_PROPERTY] === true && prop === ID_PROPERTY)
    );
}

/**
 * Retrieve the document in which the given AST node is contained. A reference to the document is
 * usually held by the root node of the AST.
 */
export function findDocument<T extends AstNode = AstNode>(node?: AstNode): LangiumDocument<T> | undefined {
    if (!node) {
        return undefined;
    }
    const rootNode = AstUtils.findRootNode(node);
    const result = rootNode.$document;
    return result ? <LangiumDocument<T>>result : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
    node: undefined,
    document: LangiumDocument<R> | undefined
): undefined;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(node: T, document: LangiumDocument<R> | undefined): T;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
    node: T | undefined,
    document: LangiumDocument<R> | undefined
): T | undefined;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
    node: T | undefined,
    document: LangiumDocument<R> | undefined
): T | undefined {
    if (!node || !document) {
        return node;
    }
    const rootNode = AstUtils.findRootNode(node);
    if (!rootNode.$document) {
        (rootNode as any).$document = document;
    }
    return node;
}

export type WithDocument<T> = T & { $document: LangiumDocument<KDLRoot> };
export type DocumentContent = LangiumDocument | AstNode;
export type TypeGuard<T> = (item: unknown) => item is T;

export function isSemanticRoot(element: unknown): element is SemanticRoot {
    return isKDLDiagram(element);
}

export function findSemanticRoot(input: DocumentContent): SemanticRoot | undefined;
export function findSemanticRoot<T extends SemanticRoot>(input: DocumentContent, guard: TypeGuard<T>): T | undefined;
export function findSemanticRoot<T extends SemanticRoot>(input: DocumentContent, guard?: TypeGuard<T>): SemanticRoot | T | undefined {
    const root = isAstNode(input) ? (input.$document?.parseResult?.value ?? AstUtils.findRootNode(input)) : input.parseResult?.value;
    const semanticRoot = isKDLRoot(root) ? root.kdlDiagram : undefined;
    return !semanticRoot ? undefined : !guard ? semanticRoot : guard(semanticRoot) ? semanticRoot : undefined;
}

export function hasSemanticRoot<T extends SemanticRoot>(document: LangiumDocument<any>, guard: (item: unknown) => item is T): boolean {
    return guard(findSemanticRoot(document));
}
