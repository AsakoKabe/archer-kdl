import 'reflect-metadata';

import { ContainerConfiguration } from '@eclipse-glsp/client';
import { GLSPStarter } from '@eclipse-glsp/vscode-integration-webview';
import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import { Container } from 'inversify';
import { initializeKDLDiagramContainer } from '@kdl/glsp-client';

class KDLStarter extends GLSPStarter {
    createContainer(...containerConfiguration: ContainerConfiguration): Container {
        return initializeKDLDiagramContainer(new Container(), ...containerConfiguration);
    }
}

new KDLStarter();
