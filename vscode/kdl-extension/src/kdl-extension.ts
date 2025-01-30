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
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

const DEFAULT_SERVER_PORT = '0';
let languageClient: LanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Start LSP server

    languageClient = startLanguageClient(context);

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

    vscode.window.showInformationMessage('Tasklist extension activated successfully.');
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (languageClient.isRunning()) {
        return languageClient.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('dist', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = {
        execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`]
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: '*', language: 'kdl' }]
    };

    // Create the language client and start the client.
    const client = new LanguageClient('kdl', 'kdl', serverOptions, clientOptions);

    // Start the client. This will also launch the server
    client.start();
    return client;
}
