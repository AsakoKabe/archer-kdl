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
import { CreateClusterHandler } from '../handler/create-cluster-node-handler.js';
import { CreateContainerHandler } from '../handler/create-container-node-handler.js';
import { CreateIngressHandler } from '../handler/create-ingress-node-handler.js';
import { CreateLinkHandler } from '../handler/create-link-handler.js';
import { CreatePodHandler } from '../handler/create-pod-node-handler.js';
import { CreatePortHandler } from '../handler/create-port-node-handler.js';
import { CreateServiceHandler } from '../handler/create-service-node-handler.js';
import { DeleteElementHandler } from '../handler/delete-element-handler.js';
import { KDLApplyLabelEditHandler } from '../handler/kdl-apply-label-edit-handler.js';
import { KDLChangeBoundsHandler } from '../handler/kdl-change-bounds-handler.js';
import { KDLChangeRoutingPointsHandler } from '../handler/kdl-change-routing-points-handler.js';
import { KDLLabelEditValidator } from '../handler/kdl-label-edit-validator.js';
import { KuberRecoverActionHandler } from '../handler/kuber-recover-action.js';
import { KuberClient } from '../kuber/client.js';
import { KDLGModelFactory } from '../model/kdl-gmodel-factory.js';
import { KDLModelIndex } from '../model/kdl-model-index.js';
import { KDLModelState } from '../model/kdl-model-state.js';
import { KDLStorage } from '../model/kdl-storage.js';
import { KuberToolPaletteItemProvider } from '../palette/kuber-palette.js';
import { KDLDiagramConfiguration } from './kdl-diagram-configuration.js';

@injectable()
export class KDLDiagramModule extends DiagramModule {
    readonly diagramType = 'kdl-diagram';

    protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
        return KDLDiagramConfiguration;
    }

    protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
        return KDLStorage;
    }

    protected bindModelState(): BindingTarget<ModelState> {
        return { service: KDLModelState };
    }

    protected bindGModelFactory(): BindingTarget<GModelFactory> {
        return KDLGModelFactory;
    }

    protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
        super.configureActionHandlers(binding);
        binding.add(ComputedBoundsActionHandler);
        binding.add(KuberRecoverActionHandler);
        this.context.bind(KuberClient).toSelf().inSingletonScope();
        this.context.bind(KDLGModelFactory).toSelf();
    }

    protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
        super.configureOperationHandlers(binding);
        binding.add(CreateLinkHandler);
        binding.add(KDLChangeBoundsHandler);
        binding.add(KDLApplyLabelEditHandler);
        binding.add(DeleteElementHandler);

        binding.add(CreateClusterHandler);
        binding.add(CreateIngressHandler);
        binding.add(CreatePodHandler);
        binding.add(CreateServiceHandler);
        binding.add(CreateContainerHandler);
        binding.add(CreatePortHandler);
        binding.add(KDLChangeRoutingPointsHandler);
    }

    protected override bindGModelIndex(): BindingTarget<GModelIndex> {
        this.context.bind(KDLModelIndex).toSelf().inSingletonScope();
        return { service: KDLModelIndex };
    }

    protected override bindLabelEditValidator(): BindingTarget<LabelEditValidator> | undefined {
        return KDLLabelEditValidator;
    }

    protected override bindToolPaletteItemProvider(): BindingTarget<ToolPaletteItemProvider> | undefined {
        return { service: KuberToolPaletteItemProvider };
    }
}
