import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { labelDelimiter } from '../utils.js';

export class ServiceTypeNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.SERVICE_TYPE;

    static override builder(): ServiceTypeNodeBuilder {
        return new ServiceTypeNodeBuilder(ServiceTypeNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('service-type')
            .resizeLocations(GResizeLocation.ALL);
    }
}

export class ServiceTypeNodeBuilder<T extends ServiceTypeNode = ServiceTypeNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }
    children(): this {
        this.proxy.children.push(this.addData());
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
                .id(this.proxy.id + labelDelimiter + 'name')
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
