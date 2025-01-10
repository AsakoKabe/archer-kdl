/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
/** @jsx svg */

import { injectable } from 'inversify';
import { RenderingContext, Hoverable, Selectable, GNode, svg, GPort, DiamondNodeView, PolylineEdgeViewWithGapsOnIntersections, GEdge, Point, toDegrees, angleOfPoint } from '@eclipse-glsp/client';
import { VNode } from 'snabbdom';

@injectable()
export class IngressNodeView extends DiamondNodeView {
    override render(node: Readonly<GNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const parallelogram = new Parallelogram(
            0,
            0,
            Math.max(node.size.width, 0),
            Math.max(node.size.height, 0)
        );

        return (
            <g>
                <polygon
                    class-sprotty-node={node instanceof GNode}
                    class-sprotty-port={node instanceof GPort}
                    class-mouseover={node.hoverFeedback}
                    class-selected={node.selected}
                    points={parallelogram.getPoints()}
                />
                {context.renderChildren(node)}
            </g>
        );
    }
}


export class Parallelogram {
    x: number;
    y: number;
    width: number;
    height: number;
    skewRatio: number;

    constructor(x: number, y: number, width: number, height: number, skewRatio: number = 0.2) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.skewRatio = skewRatio;
    }

    getPoints(): string {
        const topLeftX = this.x + this.height * this.skewRatio;
        const topLeftY = this.y;

        const topRightX = this.x + this.width + this.height * this.skewRatio;
        const topRightY = this.y;

        const bottomRightX = this.x + this.width;
        const bottomRightY = this.y + this.height;

        const bottomLeftX = this.x;
        const bottomLeftY = this.y + this.height;

        return `${topLeftX},${topLeftY} ${topRightX},${topRightY} ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`;
    }
}

@injectable()
export class ArrowEdgeView extends PolylineEdgeViewWithGapsOnIntersections {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const arrow = (
            <path
                class-sprotty-edge={true}
                class-arrow={true}
                d='M 1,0 L 10,-4 L 10,4 Z'
                transform={`rotate(${toDegrees(angleOfPoint(Point.subtract(p1, p2)))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}
            />
        );
        additionals.push(arrow);
        return additionals;
    }
}