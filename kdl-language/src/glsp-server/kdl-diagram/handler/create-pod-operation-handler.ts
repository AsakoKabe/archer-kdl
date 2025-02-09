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
export class KDLDiagramCreatePodOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Pod';
    elementTypeIds = [ModelTypes.POD];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, () => this.createPod(operation));
    }
    protected async createPod(operation: CreateNodeOperation, relativeLocation?: Point): Promise<void> {
        if (!operation.containerId) {
            throw new GLSPServerError("Pod can't be outside cluster");
        }
        const kdlDiagram = this.modelState.kdlDiagram;
        const location = relativeLocation ?? Point.ORIGIN;
        const pod = this.createPodNode(kdlDiagram);

        this.createNodeAttribute(kdlDiagram, pod, location);
        kdlDiagram.pods.push(pod);

        const cluster = this.modelState.index.findSemanticElement(operation.containerId);
        if (ast.isClusterNode(cluster)) {
            cluster.pods.push({ ref: pod, $refText: this.modelState.idProvider.getLocalId(pod) || pod.id || '' });
        }
    }

    private createPodNode(container: ast.KDLDiagram): ast.PodNode {
        return {
            $type: ast.PodNode,
            $container: container,
            id: 'PodNode' + this.modelState.kdlDiagram.pods.length,
            name: 'PodNode' + this.modelState.kdlDiagram.pods.length,
            containers: [],
            ports: []
        };
    }

    private createNodeAttribute(kdlDiagram: ast.KDLDiagram, pod: ast.PodNode, location: Point) {
        const attribute: ast.NodeAttribute = {
            $type: ast.NodeAttribute,
            $container: kdlDiagram,
            nodeID: {
                $refText: this.modelState.idProvider.getLocalId(pod) || pod.id || '',
                ref: pod
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
