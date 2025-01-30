import { Action, IActionHandler, ResponseAction } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

@injectable()
export class MyCustomResponseActionHandler implements IActionHandler {
  handle(action: MyCustomResponseAction): void | Action {
    // implement your custom logic to handle the action
    // Optionally issue a response action
  }
}

export interface MyCustomResponseAction extends ResponseAction {
    kind: typeof MyCustomResponseAction.KIND;
}

export namespace MyCustomResponseAction {
    export const KIND = 'myCustomResponse';

    export function is(object: any): object is MyCustomResponseAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { responseId?: string } = {}): MyCustomResponseAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}