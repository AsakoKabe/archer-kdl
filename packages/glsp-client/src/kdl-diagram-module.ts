/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import {
    configureDefaultModelElements,
    configureLayout,
    configureModelElement,
    ConsoleLogger,
    ContainerConfiguration,
    DefaultTypes,
    editLabelFeature,
    GCompartment,
    GCompartmentView,
    GEdge,
    GLabel,
    GLabelView,
    initializeDiagramContainer,
    LogLevel,
    overrideModelElement,
    RoundedCornerNodeView,
    StructureCompartmentView,
    TYPES
} from '@eclipse-glsp/client';
import { ModelTypes } from '@kdl/protocol';
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { FreeFormChildless } from './free-form-childless-layout';
import {
    ContainerNode,
    IngressNode,
    NamespaceNode,
    PodCardinalityNode,
    PodControllerNode,
    PodNode,
    PortNode,
    ServiceNode,
    ServiceTypeNode,
    VolumeNode
} from './model';
import { ArrowEdgeView, IngressNodeView } from './view';

const kdlDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.info);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);
    configureModelElement(context, ModelTypes.LABEL_HEADING, GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, ModelTypes.COMP_COMP, GCompartment, GCompartmentView);
    // overrideModelElement(context, DefaultTypes.GRAPH, GGraph, GLSPProjectionView);
    configureModelElement(context, ModelTypes.NAMESPACE, NamespaceNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.STRUCTURE, GCompartment, StructureCompartmentView);
    configureModelElement(context, ModelTypes.INGRESS, IngressNode, IngressNodeView);
    configureModelElement(context, ModelTypes.POD, PodNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.POD_CONTROLLER, PodControllerNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.POD_CARDINALITY, PodCardinalityNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.VOLUME, VolumeNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.SERVICE, ServiceNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.SERVICE_TYPE, ServiceTypeNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.CONTAINER, ContainerNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.PORT, PortNode, RoundedCornerNodeView);
    overrideModelElement(context, DefaultTypes.EDGE, GEdge, ArrowEdgeView);
    configureLayout({ bind, isBound }, FreeFormChildless.KIND, FreeFormChildless);
});

export function initializeKDLDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, kdlDiagramModule, ...containerConfiguration);
}
