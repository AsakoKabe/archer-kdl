import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '../utils/model-types';

export class ServiceNode extends GNode {
    name: string;
    nodeType: string;

    static override builder(): ServiceNodeBuilder {
        return new ServiceNodeBuilder(ServiceNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('service')
            .resizeLocations(GResizeLocation.CORNERS);
    }
}

export class ServiceNodeBuilder<T extends ServiceNode = ServiceNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }

    children(): this {
        this.proxy.children.push(this.createLabelCompartment());
        this.proxy.children.push(this.createStructCompartment());
        return this;
    }
    nodeType(nodeType: string): this {
        this.proxy.nodeType = nodeType;
        return this;
    }

    addPortNodes(portNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...portNodes);
        return this;
    }

    protected createLabelCompartment(): GCompartment {
        const layoutOptions: Args = { vGrab: true, vAlign: 'center'};
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_header')
            .layout('hbox')
            .addLayoutOptions(layoutOptions);
        builder.add(this.addServiceName());
        return builder.build();
    }

    protected addServiceName(): GLabel {
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
