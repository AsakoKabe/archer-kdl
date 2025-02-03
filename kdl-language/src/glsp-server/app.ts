import 'reflect-metadata';

import {
    createAppModule,
    createSocketCliParser,
    defaultSocketLaunchOptions,
    LoggerFactory,
    LogLevel,
    MaybePromise,
    ServerModule,
    SocketLaunchOptions,
    SocketServerLauncher
} from '@eclipse-glsp/server/node.js';
import { Container, ContainerModule } from 'inversify';
import { KDLDiagramModule } from './diagram/kdl-diagram-module.js';
import { GLSP_PORT_COMMAND } from '@kdl/protocol';
import { AddressInfo } from 'node:net';
import { URI } from 'vscode-uri';
import { KDLLSPServices } from '../integration.js';
import { KDLSharedServices, KDLServices } from '../language-server/kdl-module.js';

export async function launch(argv?: string[]): Promise<void> {
    const options = createSocketCliParser().parse(argv);
    const appContainer = new Container();
    appContainer.load(createAppModule(options));

    const launcher = appContainer.resolve(SocketServerLauncher);
    const serverModule = new ServerModule().configureDiagramModule(new KDLDiagramModule());

    launcher.configure(serverModule);
    launcher.start({ port: options.port, host: options.host });
}

launch(process.argv).catch(error => console.error('Error in kdl server launcher:', error));

/**
 * Launches a GLSP server with access to the given language services on the default port.
 *
 * @param services language services
 * @returns a promise that is resolved as soon as the server is shut down or rejects if an error occurs
 */
export function startGLSPServer(services: KDLLSPServices, workspaceFolder: URI): MaybePromise<void> {
    const launchOptions: SocketLaunchOptions = {
        ...defaultSocketLaunchOptions,
        host: '127.0.0.1',
        port: Number(process.env.KDL_GLSP_SERVER_PORT),
        logLevel: LogLevel.debug
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
        launcher['netServer'].on('listening', () =>
            services.shared.lsp.Connection?.onRequest(GLSP_PORT_COMMAND, () => getPort(launcher['netServer'].address()))
        );
        return stop;
    } catch (error) {
        logger.error('Error in GLSP server launcher:', error);
    }

    // Attach a generic unhandled rejection handler to prevent the process from crashing in case of an error
    process.on('unhandledRejection', error => console.log('Unhandled rejection', error));
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
