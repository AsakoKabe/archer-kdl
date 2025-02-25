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
    ModelValidator,
    MultiBinding,
    OperationHandlerConstructor,
    SourceModelStorage,
    ToolPaletteItemProvider,
    bindAsService
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { KuberClient } from '../../kuber/client.js';
import { CrossModelIndex } from '../common/cross-model-index.js';
import { CrossModelState } from '../common/cross-model-state.js';
import { CrossModelStorage } from '../common/cross-model-storage.js';
import { CrossModelSubmissionHandler } from '../common/cross-model-submission-handler.js';
import { KDLDiagramApplyLabelEditOperationHandler } from './handler/apply-edit-operation-handler.js';
import { KDLDiagramChangeBoundsOperationHandler } from './handler/change-bounds-operation-handler.js';
import { KDLDiagramChangeRoutingPointsOperation } from './handler/change-routing-points-handler.js';
import { KDLDiagramCreateContainerOperationHandler } from './handler/create-container-operation-handler.js';
import { KDLDiagramCreateIngressOperationHandler } from './handler/create-ingress-operation-handler.js';
import { KDLDiagramCreateLinkOperationHandler } from './handler/create-link-operation-handler.js';
import { KDLDiagramCreateNamespaceOperationHandler } from './handler/create-namespace-operation-handler.js';
import { KDLDiagramCreatePodCardinalityOperationHandler } from './handler/create-pod-cardinality-operation-handler.js';
import { KDLDiagramCreatePodControllerOperationHandler } from './handler/create-pod-controller-operation-handler.js';
import { KDLDiagramCreatePodOperationHandler } from './handler/create-pod-operation-handler.js';
import { KDLDiagramCreatePortOperationHandler } from './handler/create-port-operation-handler.js';
import { KDLDiagramCreateServiceOperationHandler } from './handler/create-service-operation-handler.js';
import { KDLDiagramCreateServiceTypeOperationHandler } from './handler/create-service-type-operation-handler.js';
import { KDLDiagramCreateVolumeOperationHandler } from './handler/create-volume-operation-handler.js';
import { KDLDiagramDeleteOperationHandler } from './handler/delete-operation-handler.js';
import { KDLModelValidator } from './handler/kdl-validate.js';
import { KuberRecoverActionHandler } from './handler/kuber-recover-action.js';
import { KDLDiagramConfiguration } from './kdl-diagram-configuration.js';
import { KDLLayoutOperationHandler } from './layout/layout-operation-handler.js';
import { KDLDiagramGModelFactory } from './model/kdl-diagram-gmodel-factory.js';
import { KDLModelIndex } from './model/kdl-index.js';
import { KDLModelState } from './model/kdl-state.js';
import { SystemToolPaletteProvider } from './tool-palette/kdl-tool-palette-provider.js';
import { NamespaceValidator } from './handler/validators/namespace-validator.js';
import { RootValidator } from './handler/validators/root-validator.js';
import { IngressValidator } from './handler/validators/ingress-validator.js';
import { ServiceValidator } from './handler/validators/service-validator.js';
import { PodValidator } from './handler/validators/pod-validator.js';

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
        binding.add(KDLDiagramCreateNamespaceOperationHandler);
        binding.add(KDLDiagramCreateIngressOperationHandler);
        binding.add(KDLDiagramCreateServiceOperationHandler);
        binding.add(KDLDiagramCreateServiceTypeOperationHandler);
        binding.add(KDLDiagramCreatePodOperationHandler);
        binding.add(KDLDiagramCreatePodControllerOperationHandler);
        binding.add(KDLDiagramCreatePodCardinalityOperationHandler);
        binding.add(KDLDiagramCreateContainerOperationHandler);
        binding.add(KDLDiagramCreatePortOperationHandler);
        binding.add(KDLDiagramCreateVolumeOperationHandler);
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

    protected override bindModelValidator(): BindingTarget<ModelValidator> | undefined {
        this.context.bind(RootValidator).toSelf().inSingletonScope();
        this.context.bind(NamespaceValidator).toSelf().inSingletonScope();
        this.context.bind(IngressValidator).toSelf().inSingletonScope();
        this.context.bind(ServiceValidator).toSelf().inSingletonScope();
        this.context.bind(PodValidator).toSelf().inSingletonScope();
        return KDLModelValidator;
    }
}
