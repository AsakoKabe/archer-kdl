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
export class KDLDiagramCreatePortOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Port';
    elementTypeIds = [ModelTypes.PORT];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPort(operation));
    }

    protected async createPort(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const astParent = this.modelState.index.findSemanticElement(operation.containerId);
        const container = ast.isServiceNode(astParent) || ast.isPodNode(astParent) ? astParent : undefined;
        if (!container) {
            throw new GLSPServerError("Port can't be outside service or pod");
        }
        const location = relativeLocation ?? Point.ORIGIN;

        const port: ast.PortNode = this.createPortNode(container);
        this.createNodeAttribute(this.modelState.kdlDiagram, port, location);
        container.ports.push(port);
    }

    private createPortNode(container: ast.PodNode | ast.ServiceNode): ast.PortNode {
        return {
            $type: ast.PortNode,
            $container: container,
            id: container.$type + 'Port' + container.ports.length,
            name: 'PortNode' + container.ports.length,
            number: 8080
        };
    }

    private createNodeAttribute(kdlDiagram: ast.KDLDiagram, port: ast.PortNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram.diagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(port) || port.id || '',
                ref: port
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
        kdlDiagram.diagram.nodeAttributes.push(attribute);
    }
}
