/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, DefaultServiceRegistry, IndentationAwareLexer, Module, ServiceRegistry, inject } from 'langium';
import {
    DefaultSharedModuleContext,
    LangiumServices,
    LangiumSharedServices,
    PartialLangiumServices,
    PartialLangiumSharedServices,
    createDefaultModule,
    createDefaultSharedModule
} from 'langium/lsp';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { KubeClient } from '../kuber/client.js';
import AddedSharedModelServices from '../model-server/model-module.js';
import { ModelService } from '../model-server/model-service.js';
import { OpenTextDocumentManager } from '../model-server/open-text-document-manager.js';
import { OpenableTextDocuments } from '../model-server/openable-text-documents.js';
import { Serializer } from '../model-server/serializer.js';
import { KDLGeneratedModule, KDLGeneratedSharedModule } from './generated/module.js';
import { ClientLogger } from './kdl-client-logger.js';
import { KDLCodeActionProvider } from './kdl-code-action-provider.js';
import { KDLCompletionProvider } from './kdl-completion-provider.js';
import { KDLDocumentBuilder } from './kdl-document-builder.js';
import { KDLModelFormatter } from './kdl-formatter.js';
import { KDLIndexManager } from './kdl-index-manager.js';
import { KDLLangiumDocuments } from './kdl-langium-documents.js';
import { KDLLanguageServer } from './kdl-language-server.js';
import { DefaultIdProvider } from './kdl-naming.js';
import { KDLPackageManager } from './kdl-package-manager.js';
import { KDLScopeProvider } from './kdl-scope-provider.js';
import { KDLScopeComputation } from './kdl-scope.js';
import { KDLSemanticTokenProvider } from './kdl-semantic-token-provider.js';
import { CrossModelSerializer } from './kdl-serializer.js';
import { KDLWorkspaceManager } from './kdl-workspace-manager.js';
import { KDLTokenBuilder } from './parser/kdl-indentation-aware.js';
import { KDLLinker } from './references/kdl-linker.js';
import { KDLValidator, KubeValidator, registerValidationChecks } from './kdl-validator.js';

/***************************
 * Shared Module
 ***************************/
export type ExtendedLangiumServices = LangiumServices & {
    serializer: {
        Serializer: Serializer<AstNode>;
    };
};

export class DefaultExtendedServiceRegistry extends DefaultServiceRegistry {
    protected _kdlService!: KDLServices;

    get KDL(): KDLServices {
        return this._kdlService;
    }

    set KDL(service: KDLServices) {
        this._kdlService = service;
    }

    override register(language: ExtendedLangiumServices): void {
        super.register(language);
    }

    override getServices(uri: URI): ExtendedLangiumServices {
        return super.getServices(uri) as ExtendedLangiumServices;
    }
}

export interface ExtendedServiceRegistry extends ServiceRegistry {
    KDL: KDLServices;
    register(language: ExtendedLangiumServices): void;
    getServices(uri: URI): ExtendedLangiumServices;
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface KDLAddedSharedServices {
    /* override */
    ServiceRegistry: ExtendedServiceRegistry;

    workspace: {
        /* override */ WorkspaceManager: KDLWorkspaceManager;
        PackageManager: KDLPackageManager;
        LangiumDocuments: KDLLangiumDocuments;
        IndexManager: KDLIndexManager;
    };
    logger: {
        ClientLogger: ClientLogger;
    };
    lsp: {
        /* override */ LanguageServer: KDLLanguageServer;
    };
}

export const KDLSharedServices = Symbol('KDLSharedServices');
export type KDLSharedServices = Omit<LangiumSharedServices, 'ServiceRegistry'> & KDLAddedSharedServices & AddedSharedModelServices;

export const KDLSharedModule: Module<KDLSharedServices, PartialLangiumSharedServices & KDLAddedSharedServices & AddedSharedModelServices> =
    {
        ServiceRegistry: () => new DefaultExtendedServiceRegistry(),
        workspace: {
            WorkspaceManager: services => new KDLWorkspaceManager(services),
            PackageManager: services => new KDLPackageManager(services),
            LangiumDocuments: services => new KDLLangiumDocuments(services),
            TextDocuments: services => new OpenableTextDocuments(TextDocument, services),
            TextDocumentManager: services => new OpenTextDocumentManager(services),
            DocumentBuilder: services => new KDLDocumentBuilder(services),
            IndexManager: services => new KDLIndexManager(services)
        },
        logger: {
            ClientLogger: services => new ClientLogger(services)
        },
        lsp: {
            LanguageServer: services => new KDLLanguageServer(services)
        },
        model: {
            ModelService: services => new ModelService(services)
        }
    };

/***************************
 * Language Module
 ***************************/

export interface CrossModelModuleContext {
    shared: KDLSharedServices;
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface CrossModelAddedServices {
    references: {
        IdProvider: DefaultIdProvider;
        Linker: KDLLinker;
        ScopeProvider: KDLScopeProvider;
    };
    validation: {
        CrossModelValidator: KDLValidator;
        KubeValidator: KubeValidator;
    };
    serializer: {
        Serializer: CrossModelSerializer;
    };
    parser: {
        TokenBuilder: KDLTokenBuilder;
    };
    lsp: {
        /* implement */ CodeActionProvider: KDLCodeActionProvider;
    };
    /* override */ shared: KDLSharedServices;
    api: {
        Kube: KubeClient;
    };
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type KDLServices = ExtendedLangiumServices & CrossModelAddedServices;
export const KDLServices = Symbol('KDLServices');

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export function createCrossModelModule(
    context: CrossModelModuleContext
): Module<KDLServices, PartialLangiumServices & CrossModelAddedServices> {
    return {
        references: {
            ScopeComputation: services => new KDLScopeComputation(services),
            ScopeProvider: services => new KDLScopeProvider(services),
            IdProvider: services => new DefaultIdProvider(services),
            NameProvider: services => services.references.IdProvider,
            Linker: services => new KDLLinker(services)
        },
        validation: {
            CrossModelValidator: services => new KDLValidator(services),
            KubeValidator: services => new KubeValidator(services)
        },
        lsp: {
            CodeActionProvider: () => new KDLCodeActionProvider(),
            CompletionProvider: services => new KDLCompletionProvider(services),
            Formatter: () => new KDLModelFormatter(),
            SemanticTokenProvider: services => new KDLSemanticTokenProvider(services)
        },
        serializer: {
            Serializer: services => new CrossModelSerializer(services.Grammar)
        },
        parser: {
            TokenBuilder: () => new KDLTokenBuilder(),
            Lexer: services => new IndentationAwareLexer(services)
        },
        shared: () => context.shared,
        api: {
            Kube: () => new KubeClient()
        }
    };
}

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createKDLServices(context: DefaultSharedModuleContext): {
    shared: KDLSharedServices;
    KDL: KDLServices;
} {
    const shared = inject(createDefaultSharedModule(context), KDLGeneratedSharedModule, KDLSharedModule);
    const KDL = inject(createDefaultModule({ shared }), KDLGeneratedModule, createCrossModelModule({ shared }));
    shared.ServiceRegistry.KDL = KDL;
    shared.ServiceRegistry.register(KDL);
    registerValidationChecks(KDL);
    return { shared, KDL };
}
