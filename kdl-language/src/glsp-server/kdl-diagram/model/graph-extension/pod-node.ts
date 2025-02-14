import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';

export class PodNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.POD;

    static override builder(): PodNodeBuilder {
        return new PodNodeBuilder(PodNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('pod')
            .resizeLocations(GResizeLocation.CORNERS);
    }
}

export class PodNodeBuilder<T extends PodNode = PodNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }

    children(): this {
        this.proxy.children.push(this.createLabelCompartment());
        this.proxy.children.push(this.createStructCompartment());
        return this;
    }

    addContainerNodes(containerNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...containerNodes);
        return this;
    }

    addPortNodes(portNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...portNodes);
        return this;
    }

    addControllerNode(controllerNode: GCompartment): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(controllerNode);
        return this;
    }

    addCardinalityNode(cardinalityNode: GCompartment): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(cardinalityNode);
        return this;
    }
    addVolumeNodes(volumeNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...volumeNodes);
        return this;
    }

    protected createLabelCompartment(): GCompartment {
        const layoutOptions: Args = {};
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_header')
            .layout('vbox')
            .addLayoutOptions(layoutOptions);
        builder.add(this.addPodName());
        return builder.build();
    }

    protected addPodName(): GLabel {
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
