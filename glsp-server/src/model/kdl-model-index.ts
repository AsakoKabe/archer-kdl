import { GModelIndex } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { KDL, KDLBaseElement, KDLShapeElement, Link, Port, Service } from './kdl-model';

@injectable()
export class KDLModelIndex extends GModelIndex {
    protected idToKDLElements = new Map<string, KDLBaseElement>();

    indexKDL(kdl: KDL): void {
        this.idToKDLElements.clear();
        for (const element of [
            ...kdl.clusters,
            ...kdl.ingresses,
            ...kdl.pods,
            ...kdl.services,
            ...kdl.containers,
            ...kdl.ports,
            ...kdl.links
        ]) {
            this.idToKDLElements.set(element.id, element);
        }
    }

    findTransition(id: string): Link | undefined {
        const element = this.findElement(id);
        return Link.is(element) ? element : undefined;
    }

    findElement(id: string): KDLBaseElement | undefined {
        return this.idToKDLElements.get(id);
    }

    findPort(id: string): Port | undefined {
        const element = this.findElement(id);
        return Port.is(element) ? element : undefined;
    }

    findService(id: string): Service | undefined {
        const element = this.findElement(id);
        return Service.is(element) ? element : undefined;
    }

    findBoxes(id: string): KDLShapeElement | undefined {
        const element = this.findElement(id);
        return KDLShapeElement.is(element) ? element : undefined;
    }
}
