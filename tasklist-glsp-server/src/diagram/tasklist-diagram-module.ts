/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
    ActionHandlerConstructor,
    BindingTarget,
    ComputedBoundsActionHandler,
    DiagramConfiguration,
    DiagramModule,
    GModelFactory,
    GModelIndex,
    InstanceMultiBinding,
    LabelEditValidator,
    ModelState,
    OperationHandlerConstructor,
    SourceModelStorage,
    ToolPaletteItemProvider
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CreateClusterHandler } from '../handler/create-cluster-node-handler';
import { CreateContainerHandler } from '../handler/create-container-node-handler';
import { CreateIngressHandler } from '../handler/create-ingress-node-handler';
import { CreateLinkHandler } from '../handler/create-link-handler';
import { CreatePodHandler } from '../handler/create-pod-node-handler';
import { CreatePortHandler } from '../handler/create-port-node-handler';
import { CreateServiceHandler } from '../handler/create-service-node-handler';
import { DeleteElementHandler } from '../handler/delete-element-handler';
import { TaskListApplyLabelEditHandler } from '../handler/tasklist-apply-label-edit-handler';
import { TaskListChangeBoundsHandler } from '../handler/tasklist-change-bounds-handler';
import { TaskListChangeRoutingPointsHandler } from '../handler/tasklist-change-routing-points-handler';
import { TaskListLabelEditValidator } from '../handler/tasklist-label-edit-validator';
import { TaskListGModelFactory } from '../model/tasklist-gmodel-factory';
import { TaskListModelIndex } from '../model/tasklist-model-index';
import { TaskListModelState } from '../model/tasklist-model-state';
import { TaskListStorage } from '../model/tasklist-storage';
import { TaskListDiagramConfiguration } from './tasklist-diagram-configuration';
import { KuberToolPaletteItemProvider } from '../palette/kuber-palette';
import { KuberRecoverActionHandler } from '../handler/kuber-recover-action';
import { KuberClient } from '../kuber/client';

@injectable()
export class TaskListDiagramModule extends DiagramModule {
    readonly diagramType = 'tasklist-diagram';

    protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
        return TaskListDiagramConfiguration;
    }

    protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
        return TaskListStorage;
    }

    protected bindModelState(): BindingTarget<ModelState> {
        return { service: TaskListModelState };
    }

    protected bindGModelFactory(): BindingTarget<GModelFactory> {
        return TaskListGModelFactory;
    }

    protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
        super.configureActionHandlers(binding);
        binding.add(ComputedBoundsActionHandler);
        binding.add(KuberRecoverActionHandler);
        this.context.bind(KuberClient).toSelf().inSingletonScope();
        this.context.bind(TaskListGModelFactory).toSelf();
    }

    protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
        super.configureOperationHandlers(binding);
        binding.add(CreateLinkHandler);
        binding.add(TaskListChangeBoundsHandler);
        binding.add(TaskListApplyLabelEditHandler);
        binding.add(DeleteElementHandler);

        binding.add(CreateClusterHandler);
        binding.add(CreateIngressHandler);
        binding.add(CreatePodHandler);
        binding.add(CreateServiceHandler);
        binding.add(CreateContainerHandler);
        binding.add(CreatePortHandler);
        binding.add(TaskListChangeRoutingPointsHandler);
    }

    protected override bindGModelIndex(): BindingTarget<GModelIndex> {
        this.context.bind(TaskListModelIndex).toSelf().inSingletonScope();
        return { service: TaskListModelIndex };
    }

    protected override bindLabelEditValidator(): BindingTarget<LabelEditValidator> | undefined {
        return TaskListLabelEditValidator;
    }

    protected override bindToolPaletteItemProvider(): BindingTarget<ToolPaletteItemProvider> | undefined {
        return { service: KuberToolPaletteItemProvider };
    }
}
