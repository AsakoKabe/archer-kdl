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

import {
    boundsFeature,
    deletableFeature,
    EditableLabel,
    fadeFeature,
    GChildElement,
    hoverFeedbackFeature,
    isEditableLabel,
    layoutContainerFeature,
    moveFeature,
    Nameable,
    nameFeature,
    popupFeature,
    RectangularNode,
    resizeFeature,
    selectFeature,
    WithEditableLabel,
    withEditLabelFeature
} from '@eclipse-glsp/client';

export class ClusterNode extends RectangularNode implements Nameable, WithEditableLabel {
    static override readonly DEFAULT_FEATURES = [
        deletableFeature,
        selectFeature,
        boundsFeature,
        moveFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
        nameFeature,
        withEditLabelFeature,
        resizeFeature
    ];

    name = '';

    get editableLabel(): (GChildElement & EditableLabel) | undefined {
        const label = this.children.find(element => element.type === 'label:heading');
        if (label && isEditableLabel(label)) {
            return label;
        }
        return undefined;
    }
}
