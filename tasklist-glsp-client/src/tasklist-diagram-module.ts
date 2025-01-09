/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import {
    configureDefaultModelElements,
    configureModelElement,
    ConsoleLogger,
    ContainerConfiguration,
    editLabelFeature,
    GCompartment,
    GCompartmentView,
    GLabel,
    GLabelView,
    initializeDiagramContainer,
    LogLevel,
    RoundedCornerNodeView,
    StructureCompartmentView,
    TYPES
} from '@eclipse-glsp/client';
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { ClusterNode, ContainerNode, IngressNode, PodNode, PortNode, ServiceNode } from './model';
import { IngressNodeView } from './view';

const taskListDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);
    configureModelElement(context, 'label:heading', GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'comp:comp', GCompartment, GCompartmentView);
    // overrideModelElement(context, DefaultTypes.GRAPH, GGraph, GLSPProjectionView);
    configureModelElement(context, 'cluster', ClusterNode, RoundedCornerNodeView);
    configureModelElement(context, 'struct', GCompartment, StructureCompartmentView);
    configureModelElement(context, 'ingress', IngressNode, IngressNodeView);
    configureModelElement(context, 'ingress:body', GCompartment, IngressNodeView);
    configureModelElement(context, 'pod', PodNode, RoundedCornerNodeView);
    configureModelElement(context, 'service', ServiceNode, RoundedCornerNodeView);
    configureModelElement(context, 'container', ContainerNode, RoundedCornerNodeView);
    configureModelElement(context, 'port', PortNode, RoundedCornerNodeView);
});

export function initializeTasklistDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, taskListDiagramModule, ...containerConfiguration);
}
