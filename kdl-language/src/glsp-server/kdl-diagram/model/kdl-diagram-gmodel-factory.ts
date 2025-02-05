/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GGraph, GModelFactory, ModelState } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { ClusterNode } from './cluster-node.js';
import { KDLModelState } from './kdl-state.js';
/**
 * Custom factory that translates the semantic diagram root from Langium to a GLSP graph.
 * Each semantic element in the diagram will be translated to a GModel element on the GLSP side.
 * The GLSP client will later use the GModel to render the SVG elements based on their type.
 */
@injectable()
export class KDLDiagramGModelFactory implements GModelFactory {
    @inject(ModelState) protected readonly modelState!: KDLModelState;

    createModel(): void {
        const newRoot = this.createGraph();
        if (newRoot) {
            // update GLSP root element in state so it can be used in any follow-up actions/commands
            this.modelState.updateRoot(newRoot);
        }
    }

    protected createGraph(): GGraph | undefined {
        const diagramRoot = this.modelState.kdlDiagram;
        if (!diagramRoot) {
            return;
        }
        const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
        diagramRoot.clusters.map(cluster => this.createClusterNode(cluster)).forEach(cluster => graphBuilder.add(cluster));
        return graphBuilder.build();
    }
    protected createClusterNode(cluster: ast.ClusterNode): GCompartment {
        const builder = ClusterNode.builder()
            .type(ModelTypes.CLUSTER)
            .position({ x: cluster.x, y: cluster.y })
            .name(cluster.name)
            .id(cluster.id)
            .addArgs(ArgsUtil.cornerRadius(5))
            .children()
            .addLayoutOptions({ prefWidth: cluster.width, prefHeight: cluster.height });

        return builder.build();
    }
}
