/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { labelDelimiter } from '../utils.js';
import { ServiceTypeNode } from './service-type-node.js';
import { PortNode } from './port-node.js';

export class ServiceNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.SERVICE;

    static override builder(): ServiceNodeBuilder {
        return new ServiceNodeBuilder(ServiceNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('service')
            .resizeLocations(GResizeLocation.ALL);
    }

    get serviceTypeNode(): ServiceTypeNode | undefined{
        const compartment = this.children.at(-1) as GCompartment;
        return compartment.children.find(child => child instanceof ServiceTypeNode) as ServiceTypeNode | undefined;
    }

    get portNodes(): PortNode[]{
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof PortNode) as PortNode[];
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

    addPortNodes(portNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...portNodes);
        return this;
    }

    addTypeNode(serviceTypeNode: GCompartment): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(serviceTypeNode);
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
            .id(this.proxy.id + labelDelimiter + 'name')
            .text(this.proxy.name)
            .build();
    }

    protected createStructCompartment(): GCompartment {
        return new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.STRUCTURE)
            .id(this.proxy.id + '_struct')
            .layout('freeFormChildless')
            .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true })
            .build();
    }

}
