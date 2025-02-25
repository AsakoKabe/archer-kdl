import * as k8s from '@kubernetes/client-node';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createVolumeNode, VolumeType } from '../create/create-volume-operation-handler.js';
import { Recover } from './recover.js';

export type VolumeRecoveryParams = { kuberPod: k8s.V1Pod; kubeContainers: k8s.V1Container[]; pod: ast.PodNode };

export class VolumeRecovery implements Recover<VolumeRecoveryParams> {
    constructor(private modelState: KDLModelState) {}

    recover({ kuberPod, kubeContainers, pod }: VolumeRecoveryParams): void {
        const volumes = this.extractVolumes(kuberPod, kubeContainers);
        this.addVolumesToPod(volumes, pod);
    }

    private extractVolumes(kuberPod: k8s.V1Pod, kubeContainers: k8s.V1Container[]): Set<{ name: string; type: string }> {
        const volumes = new Set<{ name: string; type: string }>();
        kuberPod.spec?.volumes?.forEach(volume => {
            if (volume.secret?.secretName) {
                volumes.add({ name: volume.secret.secretName, type: VolumeType.Secret });
            }
            if (volume.configMap?.name) {
                volumes.add({ name: volume.configMap.name, type: VolumeType.ConfigMap });
            }
        });
        if (kubeContainers) {
            kubeContainers.forEach(container => {
                this.extractContainerVolumes(container, volumes);
            });
        }
        return volumes;
    }

    private extractContainerVolumes(container: k8s.V1Container, volumes: Set<{ name: string; type: string }>): void {
        if (container.env) {
            container.env.forEach(envVar => {
                if (envVar.valueFrom?.secretKeyRef?.name) {
                    volumes.add({ name: envVar.valueFrom.secretKeyRef.name, type: VolumeType.Secret });
                }
                if (envVar.valueFrom?.configMapKeyRef?.name) {
                    volumes.add({ name: envVar.valueFrom.configMapKeyRef.name, type: VolumeType.ConfigMap });
                }
            });
        }

        if (container.envFrom) {
            container.envFrom.forEach(envFrom => {
                if (envFrom.secretRef?.name) {
                    volumes.add({ name: envFrom.secretRef.name, type: VolumeType.Secret });
                }
                if (envFrom.configMapRef?.name) {
                    volumes.add({ name: envFrom.configMapRef.name, type: VolumeType.ConfigMap });
                }
            });
        }
    }

    private addVolumesToPod(volumes: Set<{ name: string; type: string }>, pod: ast.PodNode): void {
        volumes.forEach(volume => {
            const volumeNode = createVolumeNode(pod, volume.name, volume.type as VolumeType);
            pod.volumes.push(volumeNode);
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, volumeNode);
        });
    }
}
