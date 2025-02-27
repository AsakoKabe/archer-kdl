import { Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KubeClient } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { IngressValidator } from './ingress-validator.js';
import { PodValidator } from './pod-validator.js';
import { ServiceValidator } from './service-validator.js';
import { Validator } from './validator.js';

@injectable()
export class NamespaceValidator implements Validator<NamespaceNode> {
    @inject(KubeClient)
    protected kuberClient: KubeClient;

    @inject(IngressValidator)
    protected ingressValidator: IngressValidator;

    @inject(ServiceValidator)
    protected serviceValidator: ServiceValidator;

    @inject(PodValidator)
    protected podValidator: PodValidator;

    async validate(modelNamespace: NamespaceNode): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        if (!clusterNamespaces.includes(modelNamespace.name)) {
            return [];
        }
        const markers: Marker[] = [];

        markers.push(...(await this.ingressValidator.validate(modelNamespace)));
        markers.push(...(await this.serviceValidator.validate(modelNamespace)));
        markers.push(...(await this.podValidator.validate(modelNamespace)));

        return markers;
    }
}
