/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ApplyLabelEditOperation, Command, getOrThrow, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ClusterNode, KDLRoot } from '../../../language-server/generated/ast.js';
import { findDocument } from '../../../language-server/util/ast-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';

@injectable()
export class KDLDiagramApplyLabelEditOperationHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;
    @inject(ModelState) declare modelState: KDLModelState;

    createCommand(operation: ApplyLabelEditOperation): Command {
        console.error("ApplyLabelEditOperation ", operation.labelId);
        const parentID = operation.labelId.split('_')[0];
        const parentNode = getOrThrow(this.modelState.index.findClusterNode(parentID), 'Cluster node not found');
        const oldName = parentNode.name;

        return new CrossModelCommand(
            this.modelState,
            () => this.renameEntity(parentNode, operation.text),
            () =>
                this.renameEntity(
                    parentNode,
                    oldName ?? this.modelState.idProvider.findNextId(ClusterNode, 'NewClusterNode')
                ),
            () =>
                this.renameEntity(
                    parentNode,
                    operation.text
                )
        );
    }

    protected async renameEntity(clusterNode: ClusterNode, name: string): Promise<void> {
        clusterNode.name = name;
        const document = findDocument<KDLRoot>(clusterNode)!;
        // const references = Array.from(
        //     this.modelState.services.language.references.References.findReferences(entity, { includeDeclaration: false })
        // );
        // if (references.length === 0 || (references.length === 1 && references[0].sourceUri.fsPath === this.modelState.sourceUri)) {
        //     // if the diagram is the only reference to the entity, we can safely rename it
        //     // otherwise we need to ensure to implement proper rename behavior
        //     entity.id = this.modelState.idProvider.findNextGlobalId(Entity, toId(entity.name));
        //     entityNode.entity = { $refText: entity.id, ref: entity };
        // }
        await this.modelState.modelService.save({
            uri: document.uri.toString(),
            model: document.parseResult.value,
            clientId: this.modelState.clientId
        });
    }
}
