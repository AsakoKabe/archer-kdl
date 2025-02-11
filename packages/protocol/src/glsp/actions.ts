/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Action, hasArrayProp } from '@eclipse-glsp/protocol';


// Copy definitions from (default) client-local glsp tool actions that we want to send from the server as well
export interface EnableToolsAction extends Action {
   kind: typeof EnableToolsAction.KIND;
   toolIds: string[];
}

export namespace EnableToolsAction {
   export const KIND = 'enable-tools';

   export function is(object: unknown): object is EnableToolsAction {
      return Action.hasKind(object, KIND) && hasArrayProp(object, 'toolIds');
   }

   export function create(toolIds: string[]): EnableToolsAction {
      return {
         kind: KIND,
         toolIds
      };
   }
}

/**
 * Action to disable the currently active tools and enable the default tools instead.
 */
export interface EnableDefaultToolsAction extends Action {
   kind: typeof EnableDefaultToolsAction.KIND;
}

export namespace EnableDefaultToolsAction {
   export const KIND = 'enable-default-tools';

   export function is(object: unknown): object is EnableToolsAction {
      return Action.hasKind(object, KIND);
   }

   export function create(): EnableDefaultToolsAction {
      return {
         kind: KIND
      };
   }
}

/**
 * Action to set the visibility state of the UI extension with the specified `id`.
 */
export interface SetUIExtensionVisibilityAction extends Action {
   kind: typeof SetUIExtensionVisibilityAction.KIND;
   extensionId: string;
   visible: boolean;
   contextElementsId: string[];
}

export namespace SetUIExtensionVisibilityAction {
   export const KIND = 'setUIExtensionVisibility';

   export function create(options: {
      extensionId: string;
      visible: boolean;
      contextElementsId?: string[];
   }): SetUIExtensionVisibilityAction {
      return {
         kind: KIND,
         extensionId: options.extensionId,
         visible: options.visible,
         contextElementsId: options.contextElementsId ?? []
      };
   }
}

export function activateDefaultToolsAction(): Action {
   return EnableDefaultToolsAction.create();
}

export function activateDeleteToolAction(): Action {
   return EnableToolsAction.create(['glsp.delete-mouse']);
}
