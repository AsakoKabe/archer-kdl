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
import { KDLLayoutDiagram } from './kdl-layout-diagram.js';

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
                    (new KDLLayoutDiagram(this.modelState.kdlDiagram)).layout();
                }
            }
        });
    }

}
