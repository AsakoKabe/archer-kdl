/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
    Action,
    ActionDispatcher,
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    ModelState,
    Point
} from '@eclipse-glsp/server';
import { ModelTypes } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { ClusterNode, Entity, KDLRoot } from '../../../language-server/generated/ast.js';
import { Utils } from '../../../language-server/util/uri-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import * as uuid from 'uuid';

@injectable()
export class KDLDiagramCreateEntityOperationHandler extends JsonCreateNodeOperationHandler {
    override label = 'Cluster';
    elementTypeIds = [ModelTypes.CLUSTER];

    @inject(ModelState) declare protected modelState: KDLModelState;
    @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      return new CrossModelCommand(this.modelState, () => this.createNode(operation));
    }

    protected async createNode(operation: CreateNodeOperation): Promise<void> {
        const container = this.modelState.kdlDiagram;
        const location = this.getLocation(operation) ?? Point.ORIGIN;
        const cluster: ClusterNode = {
            $type: ClusterNode,
            $container: container,
            id: uuid.v4(),
            name: 'CLusterNode',
            x: location.x,
            y: location.y,
            width: 10,
            height: 10,
            customProperties: []
        };
        container.clusters.push(cluster);
        this.actionDispatcher.dispatchAfterNextUpdate({
            kind: 'EditLabel',
            labelId: `${this.modelState.index.createId(cluster)}_label`
        } as Action);
    }

    /**
     * Creates a new entity and stores it on a file on the file system.
     */
    protected async createAndSaveEntity(operation: CreateNodeOperation): Promise<Entity | undefined> {
        // create entity, serialize and re-read to ensure everything is up to date and linked properly
        const entityRoot: KDLRoot = { $type: 'KDLRoot' };
        const id = this.modelState.idProvider.findNextId(Entity, 'NewEntity');
        const entity: Entity = {
            $type: 'Entity',
            $container: entityRoot,
            id,
            name: id,
            attributes: [],
            customProperties: [],
            superEntities: []
        };

        const dirName = UriUtils.joinPath(UriUtils.dirname(URI.parse(this.modelState.semanticUri)), '..', 'entities');
        const targetUri = UriUtils.joinPath(dirName, entity.id + '.entity.cm');
        const uri = Utils.findNewUri(targetUri);

        entityRoot.entity = entity;
        const text = this.modelState.semanticSerializer.serialize(entityRoot);

        await this.modelState.modelService.save({ uri: uri.toString(), model: text, clientId: this.modelState.clientId });
        const document = await this.modelState.modelService.request(uri.toString());
        return document?.root?.entity;
    }
}
