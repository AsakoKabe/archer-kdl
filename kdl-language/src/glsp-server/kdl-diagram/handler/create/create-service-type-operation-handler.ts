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

function getShortServiceTypeName(name: string): string {
    switch (name) {
        case 'ClusterIP':
            return 'CIP';
        case 'NodePort':
            return 'NP';
        case 'LoadBalancer':
            return 'LB';
        case 'ExternalIP':
            return 'EIP';
        default:
            return name;
    }
}

export function getFullServiceTypeName(name: string): string {
    switch (name) {
        case 'CIP':
            return 'ClusterIP';
        case 'NP':
            return 'NodePort';
        case 'LB':
            return 'LoadBalancer';
        case 'EIP':
            return 'ExternalIP';
        default:
            return name;
    }
}

export function createServiceTypeNode(service: ast.ServiceNode, name?: string): ast.ServiceTypeNode {
    return {
        $container: service,
        $type: ast.ServiceTypeNode,
        id: 'ServiceType',
        name: name ? getShortServiceTypeName(name) : 'CIP'
    };
}

@injectable()
export class KDLDiagramCreateServiceTypeOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Service Type';
    elementTypeIds = [ModelTypes.SERVICE_TYPE];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createServiceType(operation));
    }

    protected async createServiceType(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        if (!operation.containerId) {
            throw new GLSPServerError("Service Type can't be outside service");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const service = ast.isServiceNode(astParent) ? astParent : undefined;
        if (!service) {
            throw new GLSPServerError("Service Type can't be outside service");
        }
        if (service.type) {
            throw new GLSPServerError('Service Type already exist at ' + service.name);
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const serviceType: ast.ServiceTypeNode = createServiceTypeNode(service);
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, serviceType, location);
        service.type = serviceType;
    }
}
