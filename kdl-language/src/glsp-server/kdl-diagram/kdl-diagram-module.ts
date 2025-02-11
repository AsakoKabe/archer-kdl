/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
    ActionHandlerConstructor,
    BindingTarget,
    CompoundOperationHandler,
    ContextActionsProvider,
    DiagramConfiguration,
    DiagramModule,
    GModelFactory,
    GModelIndex,
    InstanceMultiBinding,
    ModelState,
    ModelSubmissionHandler,
    MultiBinding,
    OperationHandlerConstructor,
    SourceModelStorage,
    ToolPaletteItemProvider,
    bindAsService
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelIndex } from '../common/cross-model-index.js';
import { CrossModelState } from '../common/cross-model-state.js';
import { CrossModelStorage } from '../common/cross-model-storage.js';
import { CrossModelSubmissionHandler } from '../common/cross-model-submission-handler.js';
import { KDLDiagramApplyLabelEditOperationHandler } from './handler/apply-edit-operation-handler.js';
import { KDLDiagramChangeBoundsOperationHandler } from './handler/change-bounds-operation-handler.js';
import { KDLDiagramCreateClusterOperationHandler } from './handler/create-cluster-operation-handler.js';
import { KDLDiagramDeleteOperationHandler } from './handler/delete-operation-handler.js';
import { KDLDiagramConfiguration } from './kdl-diagram-configuration.js';
import { KDLDiagramGModelFactory } from './model/kdl-diagram-gmodel-factory.js';
import { KDLModelIndex } from './model/kdl-index.js';
import { KDLModelState } from './model/kdl-state.js';
import { SystemToolPaletteProvider } from './tool-palette/kdl-tool-palette-provider.js';
import { KDLDiagramCreateIngressOperationHandler } from './handler/create-ingress-operation-handler.js';
import { KDLDiagramCreatePodOperationHandler } from './handler/create-pod-operation-handler.js';
import { KDLDiagramCreateContainerOperationHandler } from './handler/create-container-operation-handler.js';
import { KDLDiagramCreatePortOperationHandler } from './handler/create-port-operation-handler.js';
import { KDLDiagramCreateServiceOperationHandler } from './handler/create-service-operation-handler.js';
import { KDLDiagramCreateLinkOperationHandler } from './handler/create-link-operation-handler.js';
import { KDLDiagramChangeRoutingPointsOperation } from './handler/change-routing-points-handler.js';
import { KuberRecoverActionHandler } from './handler/kuber-recover-action.js';
import { KuberClient } from '../../kuber/client.js';
import { KDLLayoutOperationHandler } from './layout/layout-operation-handler.js';

/**
 * Provides configuration about our system diagrams.
 */
@injectable()
export class KDLDiagramModule extends DiagramModule {
    readonly diagramType = 'kdl-diagram';

    protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
        return KDLDiagramConfiguration;
    }

    protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
        return CrossModelStorage;
    }

    protected override bindModelSubmissionHandler(): BindingTarget<ModelSubmissionHandler> {
        return CrossModelSubmissionHandler;
    }

    protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
        // super.configureOperationHandlers(binding);
        binding.add(CompoundOperationHandler);
        binding.add(KDLLayoutOperationHandler);

        binding.add(KDLDiagramChangeBoundsOperationHandler);
        binding.add(KDLDiagramDeleteOperationHandler);
        binding.add(KDLDiagramCreateClusterOperationHandler);
        binding.add(KDLDiagramCreateIngressOperationHandler);
        binding.add(KDLDiagramCreateServiceOperationHandler);
        binding.add(KDLDiagramCreatePodOperationHandler);
        binding.add(KDLDiagramCreateContainerOperationHandler);
        binding.add(KDLDiagramCreatePortOperationHandler);
        binding.add(KDLDiagramApplyLabelEditOperationHandler);
        binding.add(KDLDiagramCreateLinkOperationHandler);
        binding.add(KDLDiagramChangeRoutingPointsOperation);
    }

    protected override configureContextActionProviders(binding: MultiBinding<ContextActionsProvider>): void {
        super.configureContextActionProviders(binding);
    }

    protected override bindGModelIndex(): BindingTarget<GModelIndex> {
        bindAsService(this.context, CrossModelIndex, KDLModelIndex);
        return { service: KDLModelIndex };
    }

    protected bindModelState(): BindingTarget<ModelState> {
        bindAsService(this.context, CrossModelState, KDLModelState);
        return { service: KDLModelState };
    }

    protected bindGModelFactory(): BindingTarget<GModelFactory> {
        return KDLDiagramGModelFactory;
    }

    protected override bindToolPaletteItemProvider(): BindingTarget<ToolPaletteItemProvider> | undefined {
        return SystemToolPaletteProvider;
    }

    protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
        super.configureActionHandlers(binding);
        binding.add(KuberRecoverActionHandler);
        this.context.bind(KuberClient).toSelf().inSingletonScope();
    }
}
