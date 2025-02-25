/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   Args,
   CreateEdgeOperation,
   CreateNodeOperation,
   CreateOperationHandler,
   OperationHandlerRegistry,
   PaletteItem,
   ToolPaletteItemProvider} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { KuberRecoverRequestAction } from '../handler/kuber-recover-actions.js';


@injectable()
export class SystemToolPaletteProvider extends ToolPaletteItemProvider {
    @inject(OperationHandlerRegistry) operationHandlerRegistry: OperationHandlerRegistry;
    protected counter: number;

    getItems(_args?: Args): PaletteItem[] {
        const handlers = this.operationHandlerRegistry.getAll().filter(CreateOperationHandler.is) as CreateOperationHandler[];
        this.counter = 0;
        const nodes = this.createPaletteItem(handlers, CreateNodeOperation.KIND);
        const edges = this.createPaletteItem(handlers, CreateEdgeOperation.KIND);
        const kuberRecover = this.createKuberRecoverButton();

        return [
            { id: 'node-group', label: 'Nodes', actions: [], children: nodes, icon: 'symbol-property', sortString: 'A' },
            { id: 'edge-group', label: 'Edges', actions: [], children: edges, icon: 'symbol-property', sortString: 'B' },
            {id: 'kuber-group', label: 'Kuber', actions: [], children: [kuberRecover], icon: 'symbol-property', sortString: 'C'}

        ];
    }

    createPaletteItem(handlers: CreateOperationHandler[], kind: string): PaletteItem[] {
        return handlers
            .filter(handler => handler.operationType === kind)
            .map(handler => handler.getTriggerActions().map(action => this.create(action, handler.label)))
            .reduce((accumulator, value) => accumulator.concat(value), [])
            .sort((a, b) => a.sortString.localeCompare(b.sortString));
    }

    create(action: PaletteItem.TriggerElementCreationAction, label: string): PaletteItem {
        return { id: `palette-item${this.counter}`, sortString: label.charAt(0), label, actions: [action] };
    }
    createKuberRecoverButton(): PaletteItem {
        return {
            id: 'kuber_recover',
            label: 'Recover',
            actions: [KuberRecoverRequestAction.create({requestId: uuid.v4()})],
            // icon: 'add',
            sortString: 'Z'
        };
    }

}

