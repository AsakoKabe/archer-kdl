/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ApplyLabelEditOperation, Command, getOrThrow, GLSPServerError, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as ast from '../../../language-server/generated/ast.js';
import { KDLRoot } from '../../../language-server/generated/ast.js';
import { findDocument } from '../../../language-server/util/ast-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { KDLModelState } from '../model/kdl-state.js';
import { labelDelimiter } from '../model/utils.js';

@injectable()
export class KDLDiagramApplyLabelEditOperationHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;
    @inject(ModelState) declare modelState: KDLModelState;

    createCommand(operation: ApplyLabelEditOperation): Command {
        const nodeID = operation.labelId.split(labelDelimiter)[0];
        const labelField = operation.labelId.split(labelDelimiter)[1];
        const node = getOrThrow(this.modelState.index.findSemanticElement(nodeID, ast.isNodeType), 'Node not found');

        return new CrossModelCommand(this.modelState, () => this.renameEntity(node, operation.text, labelField));
    }

    protected async renameEntity(node: ast.NodeType, newValue: string, labelField: string): Promise<void> {
        if (ast.isNamespaceNode(node)) {
                node.name = newValue;
            } else if (ast.isIngressNode(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                } else if (labelField === 'host') {
                    node.host = newValue;
                }
            } else if (ast.isPodNode(node)) {
                node.name = newValue;
            } else if (ast.isServiceNode(node)) {
                node.name = newValue;
            } else if (ast.isContainerNode(node)) {
                node.name = newValue;
            } else if (ast.isPortNode(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                } else if (labelField === 'number') {
                    if (isNaN(Number(newValue))) {
                        throw new GLSPServerError('Port number must be a number');
                    }
                    node.number = Number(newValue);
                }
            } else if (ast.isServiceTypeNode(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                }
            } else if (ast.isPodController(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                }
            } else if (ast.isPodCardinality(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                }
            } else if (ast.isVolumeNode(node)) {
                if (labelField === 'name') {
                    node.name = newValue;
                } else if (labelField === 'type') {
                    node.type = newValue;
                }
            }
        const document = findDocument<KDLRoot>(node)!;
        await this.modelState.modelService.save({
            uri: document.uri.toString(),
            model: document.parseResult.value,
            clientId: this.modelState.clientId
        });
    }
}
