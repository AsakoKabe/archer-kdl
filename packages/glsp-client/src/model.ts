/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import {
    boundsFeature,
    deletableFeature,
    DiamondNode,
    EditableLabel,
    fadeFeature,
    GChildElement,
    hoverFeedbackFeature,
    isEditableLabel,
    layoutableChildFeature,
    layoutContainerFeature,
    moveFeature,
    Nameable,
    nameFeature,
    popupFeature,
    RectangularNode,
    ResizableModelElement,
    selectFeature,
    WithEditableLabel,
    withEditLabelFeature
} from '@eclipse-glsp/client';

export class NamespaceNode extends RectangularNode implements Nameable, WithEditableLabel {
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
        withEditLabelFeature
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

export class IngressNode extends DiamondNode implements Nameable, WithEditableLabel, ResizableModelElement {
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
        layoutableChildFeature
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

export class PodNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
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
        layoutableChildFeature
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

export class PodControllerNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        boundsFeature,
        moveFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
        nameFeature,
        withEditLabelFeature,
        layoutableChildFeature
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

export class PodCardinalityNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        boundsFeature,
        moveFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
        nameFeature,
        withEditLabelFeature,
        layoutableChildFeature
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

export class VolumeNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
    name = '';

    get editableLabel(): (GChildElement & EditableLabel) | undefined {
        const label = this.children.find(element => element.type === 'label:heading');
        if (label && isEditableLabel(label)) {
            return label;
        }
        return undefined;
    }
}

export class ServiceNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
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
        layoutableChildFeature
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

export class ServiceTypeNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        boundsFeature,
        moveFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
        nameFeature,
        withEditLabelFeature,
        layoutableChildFeature
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

export class ContainerNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
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
        layoutableChildFeature
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

export class PortNode extends RectangularNode implements Nameable, WithEditableLabel, ResizableModelElement {
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
        layoutableChildFeature
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
