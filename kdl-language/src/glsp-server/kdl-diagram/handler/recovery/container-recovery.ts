import * as k8s from '@kubernetes/client-node';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute, BaseDim } from '../../model/utils.js';
import { createContainerNode } from '../create/create-container-operation-handler.js';
import { PortRecovery } from './port-recovery.js';
import { Recover } from './recover.js';

export type PodRecoveryParams = { pod: ast.PodNode; kubeContainers: k8s.V1Container[] };

export class ContainerRecovery implements Recover<PodRecoveryParams> {
    constructor(private modelState: KDLModelState) {}

    recover({ pod, kubeContainers }: PodRecoveryParams): void {
        kubeContainers?.map(kuberContainer => {
            const container = this.createAndAddContainerNode(pod, kuberContainer);
            if (kuberContainer.ports) {
                this.recoverPodPorts(pod, kubeContainers, kuberContainer);
            }
            this.addContainerNodeAttributes(container);
        });
    }

    private createAndAddContainerNode(pod: ast.PodNode, kuberContainer: k8s.V1Container): ast.ContainerNode {
        const container = createContainerNode(pod, kuberContainer.name);
        pod.containers.push(container);
        return container;
    }

    private recoverPodPorts(pod: ast.PodNode, kubeContainers: k8s.V1Container[], kuberContainer: k8s.V1Container): void {
        new PortRecovery(this.modelState).recoverPodPorts({
            pod,
            kuberPorts: kuberContainer.ports || []
        });
    }

    private addContainerNodeAttributes(container: ast.ContainerNode): void {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, container, undefined, BaseDim.Container);
    }
}
