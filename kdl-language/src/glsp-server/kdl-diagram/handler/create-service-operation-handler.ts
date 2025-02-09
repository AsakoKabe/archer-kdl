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
        if (!operation.containerId) {
            throw new GLSPServerError("Service can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const service = this.createServiceNode(kdlDiagram);

        this.createNodeAttribute(kdlDiagram, service, location);
        kdlDiagram.services.push(service);

        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.services.push({ ref: service, $refText: this.modelState.idProvider.getLocalId(service) || service.id || '' });
        }
    }

    private createServiceNode(container: ast.KDLDiagram): ast.ServiceNode {
        return {
            $type: ast.ServiceNode,
            $container: container,
            id: 'ServiceNode' + this.modelState.kdlDiagram.services.length,
            name: 'ServiceNode' + this.modelState.kdlDiagram.services.length,
            ports: [],
            links: []
        };
    }

    private createNodeAttribute(kdlDiagram: ast.KDLDiagram, service: ast.ServiceNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(service) || service.id || '',
                ref: service
            },
            dimensions: {} as ast.Dimensions
        };
        const dimensions: ast.Dimensions = {
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            $container: attribute,
            $type: ast.Dimensions
        };
        attribute.dimensions = dimensions;
        kdlDiagram.nodeAttributes.push(attribute);
    }
}
