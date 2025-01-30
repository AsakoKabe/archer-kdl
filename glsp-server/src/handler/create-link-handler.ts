import { Command, CreateEdgeOperation, DefaultTypes, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { Link } from '../model/kdl-model';
import { KDLModelState } from '../model/kdl-model-state';

@injectable()
export class CreateLinkHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = [DefaultTypes.EDGE];

    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const link: Link = {
                id: uuid.v4(),
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId,
                type: DefaultTypes.EDGE,
                routingPoints: []
            };
            this.modelState.sourceModel.links.push(link);
        });
    }

    get label(): string {
        return 'Link';
    }
}
