/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { ValidationAcceptor } from 'langium';
import { ExtractedVolume } from '../../kuber/volume-extractor.js';
import { PodNode, VolumeNode } from '../generated/ast.js';

export async function validateVolume(
    podNode: PodNode,
    modelVolume: VolumeNode,
    kuberVolumes: Set<ExtractedVolume>,
    accept: ValidationAcceptor
): Promise<void> {
    let kuberVolume: ExtractedVolume | undefined;
    for (const volume of kuberVolumes) {
        if (volume.name === modelVolume.name) {
            kuberVolume = volume;
            break;
        }
    }
    if (!kuberVolume) {
        accept('warning', `The volume: "${modelVolume.name}" of pod: "${podNode.name}" in model does not found in cluster`, {
            node: modelVolume,
            property: 'name'
        });
        return;
    }

    if (kuberVolume.type !== modelVolume.type) {
        if (modelVolume.type) {
            accept(
                'warning',
                `The type: "${modelVolume.type}" of volume: "${modelVolume.name}" in model does not match with the type: "${kuberVolume.type}" of volume in cluster`,
                {
                    node: modelVolume,
                    property: 'type'
                }
            );
        } else {
            accept(
                'warning',
                `The type: "${modelVolume.type}" of volume: "${modelVolume.name}" in model does not match with the type: "${kuberVolume.type}" of volume in cluster`,
                {
                    node: modelVolume,
                    property: 'name'
                }
            );
        }
    }
}

export function addPodVolumeNotFoundMarkers(kuberVolumes: Set<ExtractedVolume>, podNode: PodNode, accept: ValidationAcceptor): void {
    kuberVolumes.forEach(kuberVolume => {
        const kuberVolumeName = kuberVolume.name;
        if (!podNode.volumes.map(volumeNode => volumeNode.name).includes(kuberVolumeName)) {
            if (podNode.volumes.length) {
                accept('warning', `The volume: "${kuberVolumeName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'volumes'
                });
            } else {
                accept('warning', `The volume: "${kuberVolumeName}" of pod: "${podNode.name}" in cluster does not found in model`, {
                    node: podNode,
                    keyword: 'name'
                });
            }
        }
    });
}
