import { GGraph, GModelElement, Marker, MarkersReason, ModelState, ModelValidator } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KuberClient } from '../../../kuber/client.js';
import { NamespaceValidator } from './validators/namespace-validator.js';
import { RootValidator } from './validators/root-validator.js';
import { Validator } from './validators/validator.js';
import { KDLModelState } from '../model/kdl-state.js';
import { NamespaceNode } from '../model/graph-extension/namespace-node.js';

@injectable()
export class KDLModelValidator implements ModelValidator {
    @inject(KuberClient)
    protected kuberClient: KuberClient;

    @inject(ModelState) declare protected modelState: KDLModelState;

    @inject(RootValidator)
    protected rootValidator: Validator<GGraph>;

    @inject(NamespaceValidator)
    protected namespaceValidator: Validator<NamespaceNode>;

    async validate(elements: GModelElement[], reason: string): Promise<Marker[]> {
        const markers: Marker[] = [];

        for (const element of elements) {
            if (MarkersReason.BATCH === reason) {
                markers.push(...(await this.doBatchValidation(element)));
            }
            if (element.children) {
                markers.push(...(await this.validate(element.children, reason)));
            }
        }
        return markers;
    }

    async doBatchValidation(element: GModelElement): Promise<Marker[]> {
        if (element instanceof GGraph) {
            return await this.rootValidator.validate(element);
        } else if (element instanceof NamespaceNode) {
            return await this.namespaceValidator.validate(element);
        }

        return [];
    }
}
