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
import { addNodeAttribute, BaseDim } from '../../model/utils.js';
import { createServiceTypeNode } from './create-service-type-operation-handler.js';

export function createServiceNode(namespace: ast.NamespaceNode, name?: string, type?: string): ast.ServiceNode {
    const service: ast.ServiceNode = {
        $type: ast.ServiceNode,
        $container: namespace,
        id: 'ServiceNode' + namespace.services.length,
        name: name ? name : 'ServiceNode' + namespace.services.length,
        type: {} as ast.ServiceTypeNode,
        ports: [],
        links: []
    };
    service.type = createServiceTypeNode(service, type);
    return service;
}

@injectable()
export class KDLDiagramCreateServiceOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Service';
    elementTypeIds = [ModelTypes.SERVICE];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createService(operation));
    }

    protected async createService(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Service can't be outside namespace");
        }
        const namespaceNode = this.modelState.index.findSemanticElement(operation.containerId, ast.isNamespaceNode);
        if (!namespaceNode) {
            throw new GLSPServerError('Namespace node not found');
        }
        const location = relativeLocation ?? Point.ORIGIN;
        const service = createServiceNode(namespaceNode);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, service, location, BaseDim.Service);
        if (service.type) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, service.type, location);
        }
        namespaceNode.services.push(service);
    }
}
