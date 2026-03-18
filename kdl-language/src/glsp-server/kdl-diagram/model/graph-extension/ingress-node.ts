/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { labelDelimiter } from '../utils.js';

export class IngressNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.INGRESS;
    host: string;
    namespace: string;

    static override builder(): IngressNodeBuilder {
        return new IngressNodeBuilder(IngressNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('ingress')
            .resizeLocations(GResizeLocation.ALL);
    }
}

export class IngressNodeBuilder<T extends IngressNode = IngressNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }

    children(): this {
        this.proxy.children.push(this.addData());
        return this;
    }
    host(host: string): this {
        this.proxy.host = host;
        return this;
    }
    namespace(namespace: string): this {
        this.proxy.namespace = namespace;
        return this;
    }

    protected addData(): GCompartment {
        const layoutOptions: Args = { hGrab: true, hAlign: 'center' };
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_data')
            .layout('vbox')
            .addLayoutOptions(layoutOptions);
        if (this.proxy.host) {
            builder.add(
                new GLabelBuilder(GLabel)
                    .type(ModelTypes.LABEL_HEADING)
                    .id(this.proxy.id + labelDelimiter + 'host')
                    .text(this.proxy.host)
                    .build()
            );
        }
        builder.add(
            new GLabelBuilder(GLabel)
                .type(ModelTypes.LABEL_HEADING)
                .id(this.proxy.id + labelDelimiter + 'name')
                .text(this.proxy.name)
                .build()
        );

        return builder.build();
    }
}
