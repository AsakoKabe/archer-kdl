import 'reflect-metadata';

import * as path from 'path';
import * as process from 'process';
import * as vscode from 'vscode';
import KDLEditorProvider from './kdl-editor-provider';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { GLSP_PORT_COMMAND, MODELSERVER_PORT_COMMAND } from '@kdl/protocol';
import { configureDefaultCommands, GlspVscodeConnector, SocketGlspVscodeServer } from '@eclipse-glsp/vscode-integration';
export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

const DEFAULT_GLSP_SERVER_PORT = '0';
let languageClient: LanguageClient;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Start LSP server and client
    languageClient = await startLanguageClient(context);

    // wait while glsp-server and model server launched
    await sleep(3000);

    // const modulePath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'glsp-server', 'app.js').fsPath;
    // const serverProcess = new GlspSocketServerLauncher({
    //     executable: modulePath,
    //     socketConnectionOptions: { port: JSON.parse(process.env.KDL_GLSP_SERVER_PORT || DEFAULT_GLSP_SERVER_PORT) },
    //     additionalArgs: ['--no-consoleLog', '--fileLog', '--logDir', LOG_DIR],
    //     logging: true
    // });
    // context.subscriptions.push(serverProcess);
    // await serverProcess.start();

    // Wrap glsp server
    const minimalServer = new SocketGlspVscodeServer({
        clientId: 'glsp.kdl',
        clientName: 'kdl',
        connectionOptions: { port: JSON.parse(process.env.KDL_GLSP_SERVER_PORT || DEFAULT_GLSP_SERVER_PORT) }
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

    vscode.window.showInformationMessage('KDL extension activated successfully.');
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (languageClient.isRunning()) {
        return languageClient.stop();
    }
    return undefined;
}

async function startLanguageClient(context: vscode.ExtensionContext): Promise<LanguageClient> {
    const serverOptions: ServerOptions = createServerOptions(context);
    const clientOptions: LanguageClientOptions = createClientOptions(context);

    // Start the client. This will also launch the server
    const languageClient = new LanguageClient('kdl', 'kdl', serverOptions, clientOptions);
    await languageClient.start();
    vscode.commands.registerCommand(MODELSERVER_PORT_COMMAND, () => languageClient.sendRequest(MODELSERVER_PORT_COMMAND));
    vscode.commands.registerCommand(GLSP_PORT_COMMAND, () => languageClient.sendRequest(GLSP_PORT_COMMAND));
    return languageClient;
}

function createServerOptions(context: vscode.ExtensionContext): ServerOptions {
    // needs to match the configuration in tsconfig.json and webpack.config.js
    const serverModule = context.asAbsolutePath(path.join('dist', 'language-server', 'main.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = {
        execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`]
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    return {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };
}

function createClientOptions(context: vscode.ExtensionContext): LanguageClientOptions {
    const kdlWatcher = vscode.workspace.createFileSystemWatcher('**/*.kdl');
    context.subscriptions.push(kdlWatcher);

    // watch changes to package.json as it contains the dependencies between our systems
    const packageWatcher = vscode.workspace.createFileSystemWatcher('**/package.json');
    context.subscriptions.push(packageWatcher);

    // we listen to directories separately as when we import a library, e.g., a directory within node_modules,
    // we only get that notification but not for nested files
    const directoryWatcher = vscode.workspace.createFileSystemWatcher('**/*/');
    context.subscriptions.push(directoryWatcher);

    // Options to control the language client
    return {
        documentSelector: [
            { scheme: 'file', language: 'kdl' },
            { scheme: 'file', pattern: '**/package.json' }
        ],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: [kdlWatcher, packageWatcher, directoryWatcher]
        }
    };
}
