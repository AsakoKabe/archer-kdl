/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ContextActionsProvider, EditorContext, LabeledAction, ModelState, Point } from '@eclipse-glsp/server';
import { AddEntityOperation, codiconCSSString } from '@kdl/protocol';
import { inject, injectable } from 'inversify';
import { EntityNode } from '../../../language-server/generated/ast.js';
import { KDLModelState } from '../model/kdl-state.js';

/**
 * An action provider for the command palette (Ctrl+Space) to allow adding entities to an existing diagram.
 * Each action will trigger a 'AddEntityOperation' for the specific entity.
 */
@injectable()
export class SystemDiagramAddEntityActionProvider implements ContextActionsProvider {
    contextId = 'command-palette';

    @inject(ModelState) protected state!: KDLModelState;

    async getActions(editorContext: EditorContext): Promise<LabeledAction[]> {
        const completionItems = this.state.services.language.references.ScopeProvider.complete({
            container: { globalId: this.state.kdlDiagram.id! },
            syntheticElements: [{ property: 'nodes', type: EntityNode }],
            property: 'entity'
        });
        return completionItems.map<LabeledAction>(item => ({
            label: item.label,
            actions: [AddEntityOperation.create(item.label, editorContext.lastMousePosition || Point.ORIGIN)],
            icon: codiconCSSString('inspect')
        }));
    }
}
