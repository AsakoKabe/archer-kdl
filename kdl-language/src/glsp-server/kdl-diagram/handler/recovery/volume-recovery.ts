import * as k8s from '@kubernetes/client-node';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createVolumeNode, VolumeType } from '../create/create-volume-operation-handler.js';
import { Recover } from './recover.js';
import { VolumeExtractor } from './volume-extractor.js';

export type VolumeRecoveryParams = { kuberPod: k8s.V1Pod; kubeContainers: k8s.V1Container[]; pod: ast.PodNode };

export class VolumeRecovery implements Recover<VolumeRecoveryParams> {
    constructor(private modelState: KDLModelState) {}

    recover({ kuberPod, kubeContainers, pod }: VolumeRecoveryParams): void {
        const volumes = VolumeExtractor.extractVolumes(kuberPod, kubeContainers);
        this.addVolumesToPod(volumes, pod);
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
