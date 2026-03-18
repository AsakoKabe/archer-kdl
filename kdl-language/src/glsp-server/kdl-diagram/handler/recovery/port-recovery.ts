/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import * as k8s from '@kubernetes/client-node';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addNodeAttribute } from '../../model/utils.js';
import { createPortNode } from '../create/create-port-operation-handler.js';

export type PortRecoveryParams = { pod: ast.PodNode; kuberPorts: k8s.V1ContainerPort[] };

export class PortRecovery {
    constructor(private modelState: KDLModelState) {}

    recoverPodPorts({ pod, kuberPorts }: PortRecoveryParams): void {
        kuberPorts?.map(kuberPort => {
            const port = createPortNode(pod, kuberPort.containerPort, kuberPort.name);
            pod.ports.push(port);
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, port);
        });
    }

    recoverServicePorts(service: ast.ServiceNode, kuberPorts: k8s.V1ServicePort[]): void {
        kuberPorts?.map(kuberPort => {
            const port = createPortNode(service, kuberPort.port, kuberPort.name);
            service.ports.push(port);
            if (!this.modelState.kdlDiagram.diagram) {
                return;
            }
            addNodeAttribute(this.modelState.kdlDiagram.diagram, this.modelState.idProvider, port);
        });
    }
}
