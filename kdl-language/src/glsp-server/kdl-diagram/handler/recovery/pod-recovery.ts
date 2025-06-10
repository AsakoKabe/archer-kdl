import { GLSPServerError } from '@eclipse-glsp/server';
import { KubeClient } from '../../../../kuber/client.js';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createPodNode } from '../create/create-pod-operation-handler.js';
import { ContainerRecovery } from './container-recovery.js';
import { Recover } from './recover.js';
import { VolumeRecovery } from './volume-recovery.js';

export class PodRecovery implements Recover<ast.NamespaceNode> {
    constructor(
        private kuberClient: KubeClient,
        private modelState: KDLModelState
    ) {}

    async recover(namespace: ast.NamespaceNode): Promise<void> {
        try {
            const pods = await this.kuberClient.getPods(namespace.name);
            
            for (const kuberPod of pods) {
                await this.recoverPod(namespace, kuberPod);
            }
        } catch (error) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    private async recoverPod(namespace: ast.NamespaceNode, kuberPod: any): Promise<void> {
        const controller = await this.kuberClient.getPodController(kuberPod, namespace.name);
        const pod = createPodNode(namespace, kuberPod.metadata?.name, controller?.kind, String(controller?.spec?.replicas));
        const kubeContainers = kuberPod.spec?.containers || [];
        new VolumeRecovery(this.modelState).recover({ kuberPod, kubeContainers, pod });

        namespace.pods.push(pod);
        if (kuberPod.spec?.containers) {
            new ContainerRecovery(this.modelState).recover({ pod, kubeContainers });
        }
        this.addAttributesToDiagram(pod);
    }

    private addAttributesToDiagram(pod: any): void {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod);
        if (pod.cardinality) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod.cardinality);
        }
        if (pod.controller) {
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, pod.controller);
        }
    }
}
