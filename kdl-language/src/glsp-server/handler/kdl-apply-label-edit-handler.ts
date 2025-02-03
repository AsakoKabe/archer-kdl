import { ApplyLabelEditOperation } from '@eclipse-glsp/protocol';
import { Command, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server/node.js';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-model-state.js';
import { Cluster, Container, Ingress, Pod, Port, Service } from '../model/kdl-model.js';
import { ModelTypes } from '../utils/model-types.js';

@injectable()
export class KDLApplyLabelEditHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;

    @inject(KDLModelState)
    protected override readonly modelState: KDLModelState;

    override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const labelId = operation.labelId.split('_')[0];
            const labelField = operation.labelId.split('_')[1];
            const parent = this.modelState.index.findElement(labelId);
            if (parent) {
                switch (parent.type) {
                    case ModelTypes.CLUSTER:
                        (parent as Cluster).name = operation.text;
                        break;
                    case ModelTypes.INGRESS:
                        if (labelField === 'name') {
                            (parent as Ingress).name = operation.text;
                        } else if (labelField === 'host') {
                            (parent as Ingress).host = operation.text;
                        }
                        break;
                    case ModelTypes.POD:
                        (parent as Pod).name = operation.text;
                        break;
                    case ModelTypes.SERVICE:
                        (parent as Service).name = operation.text;
                        break;
                    case ModelTypes.CONTAINER:
                        (parent as Container).name = operation.text;
                        break;
                    case ModelTypes.PORT:
                        if (labelField === 'name') {
                            (parent as Port).name = operation.text;
                        } else if (labelField === 'number') {
                            (parent as Port).number = operation.text;
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    }
}
