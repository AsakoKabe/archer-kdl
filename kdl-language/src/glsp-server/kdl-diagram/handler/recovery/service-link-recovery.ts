import * as k8s from '@kubernetes/client-node';
import { KubeClient } from '../../../../kuber/client.js';
import * as ast from '../../../../language-server/generated/ast.js';
import { KDLModelState } from '../../model/kdl-state.js';
import { addEdgeAttribute } from '../../model/utils.js';
import { Recover } from './recover.js';

export type ServiceLinkRecoveryParams = {
    namespace: string;
    namespaceNode: ast.NamespaceNode;
    service: ast.ServiceNode;
    kuberService: k8s.V1Service;
    kuberPorts: k8s.V1ServicePort[];
};

export class ServiceLinkRecovery implements Recover<ServiceLinkRecoveryParams> {
    constructor(
        private kuberClient: KubeClient,
        private modelState: KDLModelState
    ) {}

    async recover({ namespace, namespaceNode, service, kuberService, kuberPorts }: ServiceLinkRecoveryParams): Promise<void> {
        const matchedKuberPods = await this.getMatchedKuberPods(namespace, kuberService);
        const targetPods = this.getTargetPods(namespaceNode, matchedKuberPods);
        const targetPorts = this.getTargetPorts(targetPods, kuberPorts);

        targetPorts.forEach(port => {
            service.links.push({ ref: port, $refText: this.modelState.idProvider.getLocalId(port) || port.id });
            this.addEdgeAttributes(service, port);
        });
    }

    private async getMatchedKuberPods(namespace: string, kuberService: k8s.V1Service): Promise<k8s.V1Pod[]> {
        const selector = kuberService.spec?.selector || {};
        const selectorKeys = Object.keys(selector);
        return (await this.kuberClient.getPods(namespace)).filter(pod => {
            const podLabels = pod.metadata?.labels || {};
            return selectorKeys.every(key => podLabels[key] === selector[key]);
        });
    }

    private getTargetPods(namespaceNode: ast.NamespaceNode, matchedKuberPods: k8s.V1Pod[]): ast.PodNode[] {
        return namespaceNode.pods.filter(pod => matchedKuberPods.some(kuberPod => kuberPod.metadata?.name === pod.name));
    }

    private getTargetPorts(targetPods: ast.PodNode[], kuberPorts: k8s.V1ServicePort[]): ast.PortNode[] {
        return targetPods
            .flatMap(pod => pod.ports)
            .filter(
                (port): port is ast.PortNode =>
                    port !== undefined &&
                    kuberPorts.some(kuberPort => kuberPort.targetPort === port.number || kuberPort.targetPort?.toString() === port.name)
            );
    }

    private addEdgeAttributes(service: ast.ServiceNode, port: ast.PortNode): void {
        if (!this.modelState.kdlDiagram.diagram) {
            return;
        }
        addEdgeAttribute(
            this.modelState.kdlDiagram.diagram,
            this.modelState.idProvider.getLocalId(service) || service.id,
            this.modelState.idProvider.getLocalId(port) || port.id,
            service,
            port
        );
    }
}
