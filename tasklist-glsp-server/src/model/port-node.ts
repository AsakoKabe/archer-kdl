/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { Args, GCompartment, GCompartmentBuilder, GLabel, GLabelBuilder, GNode, GNodeBuilder, GResizeLocation } from '@eclipse-glsp/server';
import { ModelTypes } from '../utils/model-types';

export class PortNode extends GNode {
    name: string;
    number: string;
    nodeType: string;

    static override builder(): PortNodeBuilder {
        return new PortNodeBuilder(PortNode)
            .layout('hbox')
            .addLayoutOptions({ vAlign: 'center', hGrab: false, vGrab: false})
            .addCssClass('port')
            .resizeLocations(GResizeLocation.CORNERS);
    }
}

export class PortNodeBuilder<T extends PortNode = PortNode> extends GNodeBuilder<T> {
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
    number(number: string): this {
        this.proxy.number = number;
        return this;
    }

    protected addData(): GCompartment {
        const layoutOptions: Args = { hGrab: true, hAlign: 'center', vGap: 2 };
        const builder = new GCompartmentBuilder(GCompartment)
            .type(ModelTypes.COMP_HEADER)
            .id(this.proxy.id + '_number')
            .layout('vbox')
            .addLayoutOptions(layoutOptions);

        if (this.proxy.number) {
            builder.add(
                new GLabelBuilder(GLabel)
                    .type(ModelTypes.LABEL_HEADING)
                    .id(this.proxy.id + '_label_number')
                    .text(this.proxy.number)
                    .build()
            );
        }
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
