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
export class KDLDiagramCreateContainerOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Container';
    elementTypeIds = [ModelTypes.CONTAINER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createContainer(operation));
    }

    protected async createContainer(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Container can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const containerNode = this.createContainerNode(kdlDiagram);

        this.setNodeAttribute(kdlDiagram, containerNode, location);
        kdlDiagram.containers.push(containerNode);

        const pod = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isPodNode(pod)) {
            pod.containers.push({ ref: containerNode, $refText: this.modelState.idProvider.getLocalId(containerNode) || pod.id || '' });
        }
    }

    protected createContainerNode(container: ast.KDLDiagram): ast.ContainerNode {
        return {
            $type: ast.ContainerNode,
            $container: container,
            id: 'ContainerNode' + this.modelState.kdlDiagram.containers.length,
            name: 'ContainerNode' + this.modelState.kdlDiagram.containers.length,
            links: []
        };
    }

    private setNodeAttribute(kdlDiagram: ast.KDLDiagram, containerNode: ast.ContainerNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(containerNode) || containerNode.id || '',
                ref: containerNode
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
