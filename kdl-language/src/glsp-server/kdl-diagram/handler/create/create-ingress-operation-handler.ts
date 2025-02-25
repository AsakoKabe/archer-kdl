/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    ActionDispatcher,
    Command,
    CreateNodeOperation,
    GLSPServerError,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    ModelState,
    Point
} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../../common/cross-model-command.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';

export function createIngressNode(namespaceNode: ast.NamespaceNode, name?: string, host?: string): ast.IngressNode {
    return {
        $type: ast.IngressNode,
        $container: namespaceNode,
        id: 'IngressNode' + namespaceNode.ingresses.length,
        name: name ? name : 'IngressNode' + namespaceNode.ingresses.length,
        host: host ? host : 'localhost',
        links: []
    };
}

@injectable()
export class KDLDiagramCreateIngressOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Ingress';
    elementTypeIds = [ModelTypes.INGRESS];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createIngress(operation));
    }

    protected async createIngress(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Ingress can't be outside namespace");
        }
        const namespaceNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isNamespaceNode);
        if (!namespaceNode) {
            throw new GLSPServerError('Namespace node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const ingress = createIngressNode(namespaceNode);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, ingress, location);
        namespaceNode.ingresses.push(ingress);
    }
}
