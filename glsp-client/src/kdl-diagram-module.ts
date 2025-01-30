import {
    configureActionHandler,
    configureDefaultModelElements,
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
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { ClusterNode, ContainerNode, IngressNode, PodNode, PortNode, ServiceNode } from './model';
import { ArrowEdgeView, IngressNodeView } from './view';
import { MyCustomResponseAction, MyCustomResponseActionHandler } from './kuber-action-hundler';

const kdlDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.info);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);
    configureModelElement(context, 'label:heading', GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'comp:comp', GCompartment, GCompartmentView);
    // overrideModelElement(context, DefaultTypes.GRAPH, GGraph, GLSPProjectionView);
    configureModelElement(context, 'cluster', ClusterNode, RoundedCornerNodeView);
    configureModelElement(context, 'struct', GCompartment, StructureCompartmentView);
    configureModelElement(context, 'ingress', IngressNode, IngressNodeView);
    // configureModelElement(context, 'ingress:body', GCompartment, IngressNodeView);
    configureModelElement(context, 'pod', PodNode, RoundedCornerNodeView);
    configureModelElement(context, 'service', ServiceNode, RoundedCornerNodeView);
    configureModelElement(context, 'container', ContainerNode, RoundedCornerNodeView);
    configureModelElement(context, 'port', PortNode, RoundedCornerNodeView);
    overrideModelElement(context, DefaultTypes.EDGE, GEdge, ArrowEdgeView);
    configureActionHandler(context, MyCustomResponseAction.KIND, MyCustomResponseActionHandler);

});

export function initializeKDLDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, kdlDiagramModule, ...containerConfiguration);
}
