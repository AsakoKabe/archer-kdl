import 'reflect-metadata';

import {
    configureDefaultCommands,
    GlspSocketServerLauncher,
    GlspVscodeConnector,
    SocketGlspVscodeServer
} from '@eclipse-glsp/vscode-integration/node';
import * as path from 'path';
import * as process from 'process';
import * as vscode from 'vscode';
import KDLEditorProvider from './kdl-editor-provider';
export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

const DEFAULT_SERVER_PORT = '0';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Start server process using quickstart component
    let serverProcess: GlspSocketServerLauncher | undefined;

    if (process.env.KDL_GLSP_SERVER_DEBUG !== 'true') {
        const modulePath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'kdl-glsp-server.js').fsPath;
        serverProcess = new GlspSocketServerLauncher({
            executable: modulePath,
            socketConnectionOptions: { port: JSON.parse(process.env.KDL_GLSP_SERVER_PORT || DEFAULT_SERVER_PORT) },
            additionalArgs: ['--no-consoleLog', '--fileLog', '--logDir', LOG_DIR],
            logging: true
        });
        context.subscriptions.push(serverProcess);
        await serverProcess.start();
    }

    // Wrap server with quickstart component
    const minimalServer = new SocketGlspVscodeServer({
        clientId: 'glsp.kdl',
        clientName: 'kdl',
        connectionOptions: { port: serverProcess?.getPort() || JSON.parse(process.env.KDL_GLSP_SERVER_PORT || DEFAULT_SERVER_PORT) }
    });

    // Initialize GLSP-VSCode connector with server wrapper
    const glspVscodeConnector = new GlspVscodeConnector({
        server: minimalServer,
        logging: true
    });

    const customEditorProvider = vscode.window.registerCustomEditorProvider(
        'kdl.glspDiagram',
        new KDLEditorProvider(context, glspVscodeConnector),
        {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false
        }
    );
    context.subscriptions.push(minimalServer, glspVscodeConnector, customEditorProvider);
    minimalServer.start();

    configureDefaultCommands({ extensionContext: context, connector: glspVscodeConnector, diagramPrefix: 'kdl' });
}
