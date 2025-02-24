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
    export const LABEL_TEXT = 'label:text';
    export const LABEL_HEADING = 'label:heading';
    export const COMP_HEADER = 'comp:header';
    export const COMP_COMP = 'comp:comp';
    export const STRUCTURE = 'struct';
    export const NAMESPACE = 'namespace';
    export const INGRESS = 'ingress';
    export const POD = 'pod';
    export const POD_CONTROLLER = 'pod:controller';
    export const POD_CARDINALITY = 'pod:cardinality';
    export const VOLUME = 'volume';
    export const SERVICE = 'service';
    export const SERVICE_TYPE = 'service:type';
    export const CONTAINER = 'container';
    export const PORT = 'port';
}
