/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, ModelState, remove } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AstNode } from 'langium';
import * as ast from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramDeleteOperationHandler extends JsonOperationHandler {
    operationType = DeleteElementOperation.KIND;

    @inject(ModelState) protected override modelState!: KDLModelState;

    override createCommand(operation: DeleteElementOperation): Command | undefined {
        return new CrossModelCommand(this.modelState, () => operation.elementIds.forEach(elementId => this.delete(elementId)));
    }

    protected delete(elementId: string): void {
        const element = this.modelState.index.findSemanticElement(elementId);

        if (ast.isEdgeAttribute(element)) {
            this.deleteEdge(element);
        } else {
            this.deleteNode(element);
        }
    }
    private deleteEdge(edge: ast.EdgeAttribute | undefined): void {
        if (!edge) {
            return;
        }
        const sourceNode = edge.sourceID.ref;
        const targetNode = edge.targetID.ref;
        if (!sourceNode || !targetNode) {
            return;
        }
        sourceNode.links = sourceNode.links.filter(link => link.ref !== targetNode);

        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        remove(this.modelState.kdlDiagram.diagram.edgeAttributes, edge);
    }

    private deleteNode(modelElement: AstNode | undefined): void {
        if (!modelElement) {
            return;
        }
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        const nodeAttribute = this.modelState.kdlDiagram.diagram.nodeAttributes.find(
            nodeAttribute => nodeAttribute.nodeID.$refText === this.modelState.idProvider.getLocalId(modelElement)
        );
        remove(this.modelState.kdlDiagram.diagram.nodeAttributes, nodeAttribute);

        const edgeAttributes = this.modelState.kdlDiagram.diagram.edgeAttributes.filter(
            edgeAttribute => edgeAttribute.sourceID.ref === modelElement || edgeAttribute.targetID.ref === modelElement
        );
        remove(this.modelState.kdlDiagram.diagram.edgeAttributes, ...edgeAttributes);

        if (ast.isNamespaceNode(modelElement)) {
            this.deleteNamespace(modelElement);
        } else if (ast.isIngressNode(modelElement)) {
            this.deleteIngress(modelElement);
        } else if (ast.isPodNode(modelElement)) {
            this.deletePod(modelElement);
        } else if (ast.isPodController(modelElement)) {
            this.deletePodController(modelElement);
        } else if (ast.isPodCardinality(modelElement)) {
            this.deletePodCardinality(modelElement);
        } else if (ast.isServiceNode(modelElement)) {
            this.deleteService(modelElement);
        } else if (ast.isServiceTypeNode(modelElement)) {
            this.deleteServiceType(modelElement);
        } else if (ast.isContainerNode(modelElement)) {
            this.deleteContainer(modelElement);
        } else if (ast.isPortNode(modelElement)) {
            this.deletePort(modelElement);
        } else if (ast.isVolumeNode(modelElement)) {
            this.deleteVolume(modelElement);
        }
    }

    private deleteIngress(ingress: ast.IngressNode): void {
        remove(ingress.$container.ingresses, ingress);
    }

    private deletePod(pod: ast.PodNode): void {
        pod.containers.slice().forEach(container => {
            this.deleteNode(container);
        });
        pod.ports.slice().forEach(port => {
            this.deleteNode(port);
        });
        if (pod.controller) {
            this.deleteNode(pod.controller);
        }
        if (pod.cardinality) {
            this.deleteNode(pod.cardinality);
        }
        pod.volumes.slice().forEach(volume => {
            this.deleteNode(volume);
        });
        remove(pod.$container.pods, pod);
    }

    private deletePodController(pod: ast.PodController): void {
        pod.$container.controller = undefined;
    }

    private deletePodCardinality(podCardinality: ast.PodCardinality): void {
        podCardinality.$container.cardinality = undefined;
    }

    private deleteService(service: ast.ServiceNode): void {
        service.ports.slice().forEach(port => {
            this.deleteNode(port);
        });
        if (service.type) {
            this.deleteNode(service.type);
        }
        remove(service.$container.services, service);
    }

    private deleteServiceType(serviceType: ast.ServiceTypeNode): void {
        serviceType.$container.type = undefined;
    }

    private deleteContainer(container: ast.ContainerNode): void {
        remove(container.$container.containers, container);
    }
    private deletePort(port: ast.PortNode): void {
        remove(port.$container.ports, port);

        this.modelState.kdlDiagram.namespaces.forEach(namespace => {
            namespace.ingresses.slice().forEach(ingress => {
                ingress.links = ingress.links.filter(link => link.ref !== port);
            });
            namespace.services.slice().forEach(service => {
                service.links = service.links.filter(link => link.ref !== port);
            });
            namespace.pods.slice().forEach(pod =>
                pod.containers.forEach(container => {
                    container.links = container.links.filter(link => link.ref !== port);
                })
            );
        });
    }

    private deleteNamespace(namespace: ast.NamespaceNode): void {
        namespace.ingresses.slice().forEach(ingress => {
            this.deleteNode(ingress);
        });
        namespace.pods.slice().forEach(pod => {
            this.deleteNode(pod);
        });
        namespace.services.slice().forEach(service => {
            this.deleteNode(service);
        });
        remove(this.modelState.kdlDiagram.namespaces, namespace);
    }

    private deleteVolume(volume: ast.VolumeNode): void {
        remove(volume.$container.volumes, volume);
    }
}
