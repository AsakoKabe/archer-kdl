/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import 'reflect-metadata';

import {
    createAppModule,
    defaultSocketLaunchOptions,
    LoggerFactory,
    LogLevel,
    MaybePromise,
    ServerModule,
    SocketLaunchOptions,
    SocketServerLauncher
} from '@eclipse-glsp/server/node.js';
import { GLSP_PORT_COMMAND } from '@kdl/protocol';
import { Container, ContainerModule } from 'inversify';
import { AddressInfo } from 'node:net';
import { KDLLSPServices } from '../integration.js';
import { KDLServices, KDLSharedServices } from '../language-server/kdl-module.js';
import { KDLDiagramModule } from './kdl-diagram/kdl-diagram-module.js';

/**
 * Launches a GLSP server with access to the given language services on the default port.
 *
 * @param services language services
 * @returns a promise that is resolved as soon as the server is shut down or rejects if an error occurs
 */
export async function startGLSPServer(services: KDLLSPServices): Promise<MaybePromise<void>> {
    const launchOptions: SocketLaunchOptions = {
        ...defaultSocketLaunchOptions,
        host: '127.0.0.1',
        port: Number(process.env.KDL_GLSP_SERVER_PORT),
        logLevel: LogLevel.warn
    };
    // create module based on launch options, e.g., logging etc.
    const appModule = createAppModule(launchOptions);
    // create custom module to bind language services to support injection within GLSP classes
    const lspModule = createLSPModule(services);

    // create app container will all necessary modules and retrieve launcher
    const appContainer = new Container();
    appContainer.load(appModule, lspModule);

    const serverModule = new ServerModule().configureDiagramModule(new KDLDiagramModule());

    const logger = appContainer.get<LoggerFactory>(LoggerFactory)('KDLServer');
    const launcher = appContainer.resolve<SocketServerLauncher>(SocketServerLauncher);
    launcher.configure(serverModule);
    try {
        const stop = launcher.start(launchOptions);
        launcher['netServer'].on('listening', () => {
            services.shared.lsp.Connection?.onRequest(GLSP_PORT_COMMAND, () => getPort(launcher['netServer'].address()));
        });
        return stop;
    } catch (error) {
        logger.error('Error in GLSP server launcher:', error);
    }

    process.on('unhandledRejection', error => logger.error('Unhandled rejection:', error));
}

function getPort(address: AddressInfo | string | null): number | undefined {
    return address && !(typeof address === 'string') ? address.port : undefined;
}

/**
 * Custom module to bind language services so that they can be injected in other classes created through DI.
 *
 * @param services language services
 * @returns container module
 */
export function createLSPModule(services: KDLLSPServices): ContainerModule {
    return new ContainerModule(bind => {
        bind(KDLLSPServices).toConstantValue(services);
        bind(KDLSharedServices).toConstantValue(services.shared);
        bind(KDLServices).toConstantValue(services.language);
    });
}
