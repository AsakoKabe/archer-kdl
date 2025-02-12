/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, ModelState, remove } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as ast from '../../../language-server/generated/ast.js';
import { AstNode } from 'langium';

@injectable()
export class KDLDiagramDeleteOperationHandler extends JsonOperationHandler {
    operationType = DeleteElementOperation.KIND;

    @inject(ModelState) protected override modelState!: KDLModelState;

    override createCommand(operation: DeleteElementOperation): Command | undefined {
        return new CrossModelCommand(
            this.modelState,
             () => operation.elementIds.forEach(elementId => this.delete(elementId))
            );
    }

    protected delete(elementId: string): void {
        const element = this.modelState.index.findSemanticElement(elementId);

        if (ast.isEdgeAttribute(element)){
            this.deleteEdge(element);
        } else {
            this.deleteNode(element);
        }
    }
    private deleteEdge(edge: ast.EdgeAttribute | undefined): void {
        if (!edge){
            return;
        }
        const sourceNode = edge.sourceID.ref;
        const targetNode = edge.targetID.ref;
        if (!sourceNode || !targetNode){
            return;
        }
        sourceNode.links = sourceNode.links.filter(link => link.ref !== targetNode)

        remove(this.modelState.kdlDiagram.diagram.edgeAttributes, edge);
    }

    private deleteNode(modelElement: AstNode | undefined): void {
        if (!modelElement){
            return;
        }
        const nodeAttribute = this.modelState.kdlDiagram.diagram.nodeAttributes.find(nodeAttribute => nodeAttribute.nodeID.$refText === this.modelState.idProvider.getLocalId(modelElement)!);
        remove(this.modelState.kdlDiagram.diagram.nodeAttributes, nodeAttribute);

        const edgeAttributes = this.modelState.kdlDiagram.diagram.edgeAttributes.filter(edgeAttribute => edgeAttribute.sourceID.ref === modelElement || edgeAttribute.targetID.ref === modelElement);
        remove(this.modelState.kdlDiagram.diagram.edgeAttributes, ...edgeAttributes);

        if (ast.isClusterNode(modelElement)) {
            this.deleteCluster(modelElement);
        } else if (ast.isIngressNode(modelElement)) {
            this.deleteIngress(modelElement);
        } else if (ast.isPodNode(modelElement)) {
            this.deletePod(modelElement);
        } else if (ast.isServiceNode(modelElement)) {
            this.deleteService(modelElement);
        } else if (ast.isContainerNode(modelElement)) {
            this.deleteContainer(modelElement);
        } else if (ast.isPortNode(modelElement)) {
            this.deletePort(modelElement);
        }
    }
    
    private deleteIngress(ingress: ast.IngressNode): void {
        this.modelState.kdlDiagram.model.clusters.map(cluster => {
            cluster.ingresses = cluster.ingresses.filter(existedIngress => existedIngress.ref !== ingress);
        });
        remove(this.modelState.kdlDiagram.model.ingresses, ingress);
    }

    private deletePod(pod: ast.PodNode): void {
        pod.containers.map(container => {
            this.deleteNode(container.ref);
        });
        pod.ports.map(port => {
            this.deleteNode(port);
        });
        this.modelState.kdlDiagram.model.clusters.map(cluster => {
            cluster.pods = cluster.pods.filter(existedPod => existedPod.ref !== pod);
        });
        remove(this.modelState.kdlDiagram.model.pods, pod);
    }

    private deleteService(service: ast.ServiceNode): void {
        service.ports.map(port => {
            this.deleteNode(port);
        });
        this.modelState.kdlDiagram.model.clusters.map(cluster => {
            cluster.services = cluster.services.filter(existedService => existedService.ref !== service);
        });
        remove(this.modelState.kdlDiagram.model.services, service);
    }

    private deleteContainer(container: ast.ContainerNode): void {
        this.modelState.kdlDiagram.model.pods.map(pod => {
            pod.containers = pod.containers.filter(existedContainer => existedContainer.ref !== container);
        });
        remove(this.modelState.kdlDiagram.model.containers, container);
    }

    private deletePort(port: ast.PortNode): void {
        this.modelState.kdlDiagram.model.pods.map(pod => {
            pod.ports = pod.ports.filter(existedPort => existedPort !== port);
        });
        this.modelState.kdlDiagram.model.services.map(service => {
            service.ports = service.ports.filter(existedPort => existedPort !== port);
        });
        this.modelState.kdlDiagram.model.ingresses.map(ingress => {
            ingress.links = ingress.links.filter(link => link.ref !== port)
        })
        this.modelState.kdlDiagram.model.services.map(service => {
            service.links = service.links.filter(link => link.ref !== port)
        })
        this.modelState.kdlDiagram.model.containers.map(container => {
            container.links = container.links.filter(link => link.ref !== port)
        })
        // remove(this.modelState.kdlDiagram.ports, port);
    }

    private deleteCluster(cluster: ast.ClusterNode): void {
        cluster.ingresses.map(ingress => {
            this.deleteNode(ingress.ref);
        });
        cluster.pods.map(pod => {
            this.deleteNode(pod.ref);
        });
        cluster.services.map(service => {
            this.deleteNode(service.ref);
        });
        remove(this.modelState.kdlDiagram.model.clusters, cluster);
    }
}
