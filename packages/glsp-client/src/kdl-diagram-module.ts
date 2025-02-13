import {
    configureActionHandler,
    configureDefaultModelElements,
    configureModelElement,
    ConsoleLogger,
    ContainerConfiguration,
    DefaultTypes,
    deletableFeature,
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
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { MyCustomResponseAction, MyCustomResponseActionHandler } from './kuber-action-hundler';
import { ClusterNode, IngressNode, PodNode, ServiceNode, ContainerNode, PortNode, ServiceTypeNode } from './model';
import { IngressNodeView, ArrowEdgeView } from './view';
import { ModelTypes } from '@kdl/protocol';

const kdlDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.info);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);
    configureModelElement(context, ModelTypes.LABEL_HEADING, GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, ModelTypes.COMP_COMP, GCompartment, GCompartmentView);
    // overrideModelElement(context, DefaultTypes.GRAPH, GGraph, GLSPProjectionView);
    configureModelElement(context, ModelTypes.CLUSTER, ClusterNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.STRUCTURE, GCompartment, StructureCompartmentView);
    configureModelElement(context, ModelTypes.INGRESS, IngressNode, IngressNodeView);
    // configureModelElement(context, 'ingress:body', GCompartment, IngressNodeView);
    configureModelElement(context, ModelTypes.POD, PodNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.SERVICE, ServiceNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.SERVICE_TYPE, ServiceTypeNode, RoundedCornerNodeView, { disable: [deletableFeature] });
    configureModelElement(context, ModelTypes.CONTAINER, ContainerNode, RoundedCornerNodeView);
    configureModelElement(context, ModelTypes.PORT, PortNode, RoundedCornerNodeView);
    overrideModelElement(context, DefaultTypes.EDGE, GEdge, ArrowEdgeView);
    configureActionHandler(context, MyCustomResponseAction.KIND, MyCustomResponseActionHandler);
});

export function initializeKDLDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, kdlDiagramModule, ...containerConfiguration);
}
