/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Args, DefaultTypes } from '@eclipse-glsp/protocol';

// System Diagram
export const ENTITY_NODE_TYPE = DefaultTypes.NODE + ':entity';
export const RELATIONSHIP_EDGE_TYPE = DefaultTypes.EDGE + ':relationship';
export const LABEL_ENTITY = DefaultTypes.LABEL + ':entity';

// Mapping Diagram
export const SOURCE_OBJECT_NODE_TYPE = DefaultTypes.NODE + ':source-object';
export const SOURCE_NUMBER_NODE_TYPE = DefaultTypes.NODE + ':source-number';
export const SOURCE_STRING_NODE_TYPE = DefaultTypes.NODE + ':source-string';
export const TARGET_OBJECT_NODE_TYPE = DefaultTypes.NODE + ':target-object';
export const TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE = DefaultTypes.EDGE + ':target-attribute-mapping';
export const ATTRIBUTE_COMPARTMENT_TYPE = DefaultTypes.COMPARTMENT + ':attribute';

// Args
export const REFERENCE_CONTAINER_TYPE = 'reference-container-type';
export const REFERENCE_PROPERTY = 'reference-property';
export const REFERENCE_VALUE = 'reference-value';

export type RenderProps = Record<string, string | number | boolean | undefined> & {
    theme: 'light' | 'dark' | 'hc' | 'hcLight'; // supported ThemeType of Theia
};

export namespace RenderProps {
    export function key(name: string): string {
        return 'render-prop-' + name;
    }

    export function read(args: Args): Partial<RenderProps> {
        return Object.keys(args).reduce((renderProps, argKey) => {
            if (argKey.startsWith('render-prop-')) {
                renderProps[argKey.substring('render-prop-'.length)] = args[argKey];
            }
            return renderProps;
        }, {} as Args);
    }

    export const TARGET_ATTRIBUTE_MAPPING_IDX = RenderProps.key('mappingIndex');
    export const SOURCE_OBJECT_IDX = RenderProps.key('sourceObjectIndex');
}

export namespace ModelTypes {
    export const CLUSTER = 'cluster';
    export const INGRESS = 'ingress';
    export const LABEL_HEADING = 'label:heading';
    export const LABEL_TEXT = 'label:text';
    export const COMP_HEADER = 'comp:header';
    export const COMP_COMP = 'comp:comp';
    export const STRUCTURE = 'struct';
    export const INGRESS_BODY = 'ingress:body';
    export const POD = 'pod';
    export const SERVICE = 'service';
    export const SERVICE_TYPE = 'service:type';
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
            case SERVICE_TYPE:
                return 'service:type';
            case CONTAINER:
                return 'container';
            case PORT:
                return 'port';
            default:
                return 'unknown';
        }
    }
}
