import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';

export class PodCardinalityNode extends GNode {
    name: string;
    nodeType: string;

    static override builder(): PodCardinalityNodeBuilder {
        return new PodCardinalityNodeBuilder(PodCardinalityNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('pod-cardinality')
            .resizeLocations(GResizeLocation.CORNERS);
    }
}

export class PodCardinalityNodeBuilder<T extends PodCardinalityNode = PodCardinalityNode> extends GNodeBuilder<T> {
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

    protected addData(): GCompartment {
        const layoutOptions: Args = { hGrab: true, hAlign: 'center', vGap: 2 };
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_data')
            .layout('vbox')
            .addLayoutOptions(layoutOptions);

        builder.add(
            new GLabelBuilder(GLabel)
                .type(ModelTypes.LABEL_HEADING)
                .id(this.proxy.id + '_name')
                .text(this.proxy.name)
                .build()
        );
        return builder.build();
    }

    protected createStructCompartment(): GCompartment {
        return new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.STRUCTURE)
            .id(this.proxy.id + '_struct')
            .layout('freeform')
            .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true })
            .build();
    }
}
