import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { ModelTypes } from '../utils/model-types.js';

export class ClusterNode extends GNode {
    name: string;
    nodeType: string;
    container: GCompartment;

    static override builder(): ClusterNodeBuilder {
        return new ClusterNodeBuilder(ClusterNode)
            .layout('vbox')
            .addLayoutOptions({ hAlign: 'center', hGrab: false, vGrab: false })
            .addCssClass('cluster');
    }
}

export class ClusterNodeBuilder<T extends ClusterNode = ClusterNode> extends GNodeBuilder<T> {
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
    addIngressNodes(ingressNodes: GCompartment[]): this {
        // const builder = new GCompartmentBuilder(GCompartment)
        //     .type(ModelTypes.STRUCTURE)
        //     .id(this.proxy.id + '_ingress')
        //     .layout('freeform')
        //     .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true });

        // if (ingressNodes) {
        //     builder.addChildren(ingressNodes);
        // }
        // this.proxy.children.push(builder.build());
        (this.proxy.children.at(-1) as GCompartment).children.push(...ingressNodes);

        return this;
    }

    addPodNodes(podNodes: GCompartment[]): this {
        // const builder = new GCompartmentBuilder(GCompartment)
        //     .type(ModelTypes.STRUCTURE)
        //     .id(this.proxy.id + '_pod')
        //     .layout('freeform')
        //     .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true });

        // if (podNodes) {
        //     builder.addChildren(podNodes);
        // }
        // this.proxy.children.push(builder.build());
        // console.error(this.proxy.children.at(-1));
        (this.proxy.children.at(-1) as GCompartment).children.push(...podNodes);

        return this;
    }

    addServiceNodes(serviceNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...serviceNodes);

        return this;
    }
    addContainerNodes(containerNodes: GCompartment[]): this {
        (this.proxy.children.at(-1) as GCompartment).children.push(...containerNodes);

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
            .id(this.proxy.id + '_classname')
            .text(this.proxy.name)
            .build();
    }

    protected createStructCompartment(): GCompartment {
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.STRUCTURE)
            .id(this.proxy.id + '_struct')
            .layout('freeform')
            .addLayoutOptions({ hAlign: 'left', hGrab: true, vGrab: true });

        return builder.build();
    }
}
