/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import * as k8s from '@kubernetes/client-node';

export type ExtractedVolume = {
    name: string;
    type: string;
};
export enum VolumeType {
    Secret = 'secret',
    ConfigMap = 'configmap'
}
export class VolumeExtractor {
    static extractVolumes(kuberPod: k8s.V1Pod, kubeContainers: k8s.V1Container[]): Set<ExtractedVolume> {
        const volumes = new Set<ExtractedVolume>();
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

    private static extractContainerVolumes(container: k8s.V1Container, volumes: Set<ExtractedVolume>): void {
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
}
