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
export class KDLDiagramCreateIngressOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Ingress';
    elementTypeIds = [ModelTypes.INGRESS];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createIngress(operation));
    }

    protected async createIngress(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Ingress can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const ingress = this.createIngressNode(kdlDiagram);

        this.addNodeAttribute(kdlDiagram, ingress, location);
        kdlDiagram.ingresses.push(ingress);

        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.ingresses.push({ ref: ingress, $refText: this.modelState.idProvider.getLocalId(ingress) || ingress.id || '' });
        }
    }

    private createIngressNode(container: ast.KDLDiagram): ast.IngressNode {
        return {
            $type: ast.IngressNode,
            $container: container,
            id: 'IngressNode' + this.modelState.kdlDiagram.ingresses.length,
            name: 'IngressNode' + this.modelState.kdlDiagram.ingresses.length,
            host: 'localhost',
            links: []
        };
    }
    private addNodeAttribute(kdlDiagram: ast.KDLDiagram, ingress: ast.IngressNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(ingress) || ingress.id || '',
                ref: ingress
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
