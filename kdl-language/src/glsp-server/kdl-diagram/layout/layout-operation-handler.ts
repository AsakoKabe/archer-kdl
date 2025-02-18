import {
    JsonOperationHandler,
    LayoutOperation,
    Command,
    MaybePromise,
    ModelState,
    DiagramConfiguration,
    ServerLayoutKind,
} from '@eclipse-glsp/server';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { inject, injectable } from 'inversify';

@injectable()
export class KDLLayoutOperationHandler extends JsonOperationHandler {
    override operationType = LayoutOperation.KIND;

    @inject(DiagramConfiguration)
    protected diagramConfiguration: DiagramConfiguration;

    @inject(ModelState) protected override modelState!: KDLModelState;

    override createCommand(operation: LayoutOperation): MaybePromise<Command | undefined> {
        return new CrossModelCommand(this.modelState, async () => {
            if (operation.kind === LayoutOperation.KIND) {
                if (this.diagramConfiguration.layoutKind === ServerLayoutKind.MANUAL) {
                    this.layout(operation)
                }
            }
        });
    }

    private layout(operation: LayoutOperation): void {
        // const kdlDiagram = this.modelState.kdlDiagram;
        // const cluster = kdlDiagram.clusters.at(1)!;
        // const countPods = cluster.pods.length;
        // const paddingWidth = 100;
        // const paddingHeight = 100;
    }

}
