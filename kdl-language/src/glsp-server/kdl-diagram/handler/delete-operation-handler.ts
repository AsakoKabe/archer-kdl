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
        this.deleteModelElement(element);
    }
    private deleteModelElement(modelElement: AstNode | undefined): void {
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
        };
    }

    private deleteIngress(ingress: ast.IngressNode): void {
        this.modelState.kdlDiagram.clusters.forEach(cluster => {
            cluster.ingresses = cluster.ingresses.filter(existedIngress => existedIngress.ref !== ingress);
        });
        remove(this.modelState.kdlDiagram.ingresses, ingress);
    }

    private deletePod(pod: ast.PodNode): void {
        pod.containers.forEach(container => {
            this.deleteModelElement(container.ref);
        });
        pod.ports.forEach(port => {
            this.deleteModelElement(port.ref);
        });
        this.modelState.kdlDiagram.clusters.forEach(cluster => {
            cluster.pods = cluster.pods.filter(existedPod => existedPod.ref !== pod);
        });
        remove(this.modelState.kdlDiagram.pods, pod);
    }

    private deleteService(service: ast.ServiceNode): void {
        service.ports.forEach(port => {
            this.deleteModelElement(port.ref);
        });
        this.modelState.kdlDiagram.clusters.forEach(cluster => {
            cluster.services = cluster.services.filter(existedService => existedService.ref !== service);
        });
        remove(this.modelState.kdlDiagram.services, service);
    }

    private deleteContainer(container: ast.ContainerNode): void {
        this.modelState.kdlDiagram.pods.forEach(pod => {
            pod.containers = pod.containers.filter(existedContainer => existedContainer.ref !== container);
        });
        remove(this.modelState.kdlDiagram.containers, container);
    }

    private deletePort(port: ast.PortNode): void {
        this.modelState.kdlDiagram.pods.forEach(pod => {
            pod.ports = pod.ports.filter(existedPort => existedPort.ref !== port);
        });
        this.modelState.kdlDiagram.services.forEach(service => {
            service.ports = service.ports.filter(existedPort => existedPort.ref !== port);
        });
        remove(this.modelState.kdlDiagram.ports, port);
    }

    private deleteCluster(cluster: ast.ClusterNode): void {
        cluster.ingresses.forEach(ingress => {
            this.deleteModelElement(ingress.ref);
        });
        cluster.pods.forEach(pod => {
            this.deleteModelElement(pod.ref);
        });
        cluster.services.forEach(service => {
            this.deleteModelElement(service.ref);
        });
        remove(this.modelState.kdlDiagram.clusters, cluster);
    }
}
