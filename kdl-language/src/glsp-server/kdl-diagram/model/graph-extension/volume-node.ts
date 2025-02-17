import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';

export class VolumeNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.VOLUME;
    volumeType: string;

    static override builder(): VolumeNodeBuilder {
        return new VolumeNodeBuilder(VolumeNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('pod-volume');
    }
}

export class VolumeNodeBuilder<T extends VolumeNode = VolumeNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }
    children(): this {
        this.proxy.children.push(this.addData());
        return this;
    }
    volumeType(volumeType: string): this {
        this.proxy.volumeType = volumeType;
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
        builder.add(
            new GLabelBuilder(GLabel)
                .type(ModelTypes.LABEL_HEADING)
                .id(this.proxy.id + '_type')
                .text(this.proxy.volumeType)
                .build()
        );
        return builder.build();
    }
}
