import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { labelDelimiter } from '../utils.js';
import { IngressNode } from './ingress-node.js';
import { ServiceNode } from './service-node.js';
import { PodNode } from './pod-node.js';

export class NamespaceNode extends GNode {
    name: string;
    nodeType: string = ModelTypes.NAMESPACE;
    container: GCompartment;

    static override builder(): NamespaceNodeBuilder {
        return new NamespaceNodeBuilder(NamespaceNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('namespace')
            .resizeLocations(GResizeLocation.ALL);
    }

    get ingressNodes(): IngressNode[]{
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof IngressNode) as IngressNode[];
    }

    get serviceNodes(): ServiceNode[]{
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof ServiceNode) as ServiceNode[];
    }

    get podNodes(): PodNode[]{
        return (this.children.at(-1) as GCompartment).children.filter(child => child instanceof PodNode) as PodNode[];
    }

}

export class NamespaceNodeBuilder<T extends NamespaceNode = NamespaceNode> extends GNodeBuilder<T> {
    name(name: string): this {
        this.proxy.name = name;
        return this;
    }

    children(): this {
        this.proxy.children.push(this.createLabelCompartment());
        this.proxy.children.push(this.createStructCompartment());
        return this;
    }

    addIngressNodes(ingressNodes: IngressNode[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...ingressNodes);
        return this;
    }

    addPodNodes(podNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...podNodes);
        return this;
    }

    addServiceNodes(serviceNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...serviceNodes);
        return this;
    }

    protected createLabelCompartment(): GCompartment {
        const layoutOptions: Args = {};
        return new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_header')
            .layout('hbox')
            .addLayoutOptions(layoutOptions)
            .add(this.createCompartmentHeader())
            .build();
    }

    protected createCompartmentHeader(): GLabel {
        return new GLabelBuilder(GLabel)
            .type(ModelTypes.LABEL_HEADING)
            .id(this.proxy.id + labelDelimiter + 'name')
            .text(this.proxy.name)
            .build();
    }

    protected createStructCompartment(): GCompartment {
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.STRUCTURE)
            .id(this.proxy.id + '_struct')
            .layout('freeFormChildless')
            .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true });

        return builder.build();
    }
}
