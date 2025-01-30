export namespace ModelTypes {
    export const CLUSTER = 'cluster';
    export const INGRESS = 'ingress';
    export const LABEL_HEADING = 'label:heading';
    export const LABEL_TEXT = 'label:text';
    export const COMP_HEADER = 'comp:header';
    export const STRUCTURE = 'struct';
    export const INGRESS_BODY = 'ingress:body';
    export const POD = 'pod';
    export const SERVICE = 'service';
    export const CONTAINER = 'container';
    export const PORT = 'port';

    export function toNodeType(type: string): string {
        switch (type) {
            case CLUSTER:
                return 'cluster';
            case INGRESS:
                return 'ingress';
            case POD:
                return 'pod';
            case SERVICE:
                return 'service';
            case CONTAINER:
                return 'container';
            case PORT:
                return 'port';
            default:
                return 'unknown';
        }
    }

}
