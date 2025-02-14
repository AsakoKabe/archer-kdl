import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';

export class IngressNode extends GNode {
    name: string;
    nodeType: string;
    host: string;

    static override builder(): IngressNodeBuilder {
        return new IngressNodeBuilder(IngressNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('ingress')
            .resizeLocations(GResizeLocation.CORNERS);
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
    nodeType(nodeType: string): this {
        this.proxy.nodeType = nodeType;
        return this;
    }
    host(host: string): this {
        this.proxy.host = host;
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
                    .id(this.proxy.id + '_host')
                    .text(this.proxy.host)
                    .build()
            );
        }
        builder.add(
            new GLabelBuilder(GLabel)
                .type(ModelTypes.LABEL_HEADING)
                .id(this.proxy.id + '_name')
                .text(this.proxy.name)
                .build()
        );

        return builder.build();
    }
}
