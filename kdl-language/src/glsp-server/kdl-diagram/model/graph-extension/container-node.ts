import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';

export class ContainerNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.CONTAINER;

    static override builder(): ContainerNodeBuilder {
        return new ContainerNodeBuilder(ContainerNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('container')
            .resizeLocations(GResizeLocation.CORNERS);
    }
}

export class ContainerNodeBuilder<T extends ContainerNode = ContainerNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }

    children(): this {
        this.proxy.children.push(this.createLabelCompartment());
        // this.proxy.children.push(this.createStructCompartment());
        return this;
    }

    protected createLabelCompartment(): GCompartment {
        const layoutOptions: Args = { vGrab: true, vAlign: 'center'};
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_header')
            .layout('hbox')
            .addLayoutOptions(layoutOptions);
        builder.add(this.addContainerName());
        return builder.build();
    }

    protected addContainerName(): GLabel {
        return new GLabelBuilder(GLabel)
            .type(ModelTypes.LABEL_HEADING)
            .id(this.proxy.id + '_name')
            .text(this.proxy.name)
            .build();
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
