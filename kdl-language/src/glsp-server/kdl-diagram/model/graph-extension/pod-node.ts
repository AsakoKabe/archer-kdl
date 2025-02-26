import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { labelDelimiter } from '../utils.js';
import { PortNode } from './port-node.js';
import { PodControllerNode } from './pod-controller-node.js';
import { PodCardinalityNode } from './pod-cardinality-node.js';
import { VolumeNode } from './volume-node.js';
import { ContainerNode } from './container-node.js';

export class PodNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.POD;

    static override builder(): PodNodeBuilder {
        return new PodNodeBuilder(PodNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false, resizeContainer: true })
            .addCssClass('pod')
            .resizeLocations(GResizeLocation.ALL);
    }

    get portNodes(): PortNode[] {
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof PortNode) as PortNode[];
    }

    get controllerNode(): PodControllerNode | undefined {
        const compartment = this.children.at(-1) as GCompartment;
        return compartment.children.find(child => child instanceof PodControllerNode) as PodControllerNode | undefined;
    }

    get cardinalityNode(): PodCardinalityNode | undefined {
        const compartment = this.children.at(-1) as GCompartment;
        return compartment.children.find(child => child instanceof PodCardinalityNode) as PodCardinalityNode | undefined;
    }

    get volumeNodes(): VolumeNode[] {
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof VolumeNode) as VolumeNode[];
    }

    get containerNodes(): ContainerNode[] {
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof ContainerNode) as ContainerNode[];
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
        const layoutOptions: Args = { resizeContainer: true };
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
            .id(this.proxy.id + labelDelimiter + 'name')
            .text(this.proxy.name)
            .build();
    }

    protected createStructCompartment(): GCompartment {
        return new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.STRUCTURE)
            .id(this.proxy.id + '_struct')
            .layout('freeFormChildless')
            .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true, resizeContainer: true })
            .build();
    }
}
