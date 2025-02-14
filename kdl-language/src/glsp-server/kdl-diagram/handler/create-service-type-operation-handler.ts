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
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { addNodeAttribute, createServiceTypeNode } from '../model/utils.js';

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
        if (!operation.containerId) {
            throw new GLSPServerError("Service Type can't be outside service");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const service = ast.isServiceNode(astParent) ? astParent : undefined;
        if (!service) {
            throw new GLSPServerError("Service Type can't be outside service");
        }
        if (service.type){
            throw new GLSPServerError("Service Type already exist at " + service.name);
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const serviceType: ast.ServiceTypeNode = createServiceTypeNode(service);
        addNodeAttribute(this.modelState.kdlDiagram, this.modelState.idProvider, serviceType, location);
        service.type = serviceType;
    }
}
