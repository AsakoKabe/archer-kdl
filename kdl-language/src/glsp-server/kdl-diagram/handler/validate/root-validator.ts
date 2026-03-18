/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { GGraph, Marker, MarkerKind } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KubeClient } from '../../../../kuber/client.js';
import { NamespaceNode } from '../../model/graph-extension/namespace-node.js';
import { createErrorMessage, Validator } from './validator.js';

@injectable()
export class RootValidator implements Validator<GGraph> {
    @inject(KubeClient)
    protected kuberClient: KubeClient;

    async validate(root: GGraph): Promise<Marker[]> {
        const clusterNamespaces = await this.kuberClient.getNamespaces();
        const modelNamespaces = this.getModelNamespaces(root);
        const notFoundNamespaces = this.getNotFoundNamespaces(clusterNamespaces, modelNamespaces);

        const markers: Marker[] = [];
        this.addNamespaceNotFoundMarkers(notFoundNamespaces, root, markers);
        this.addNamespaceMismatchMarkers(clusterNamespaces, modelNamespaces, markers);

        return markers;
    }

    private getModelNamespaces(root: GGraph): NamespaceNode[] {
        return root.children.reduce((namespaces: NamespaceNode[], child) => {
            if (child instanceof NamespaceNode) {
                namespaces.push(child);
            }
            return namespaces;
        }, []);
    }

    private getNotFoundNamespaces(clusterNamespaces: string[], modelNamespaces: NamespaceNode[]): string[] {
        const modelNamespaceNames = modelNamespaces.map(namespace => namespace.name);
        return clusterNamespaces.filter(name => !modelNamespaceNames.includes(name));
    }

    private addNamespaceNotFoundMarkers(notFoundNamespaces: string[], root: GGraph, markers: Marker[]): void {
        notFoundNamespaces.map(name => {
            markers.push({
                kind: MarkerKind.ERROR,
                description: createErrorMessage('namespace', name, 'model'),
                elementId: root.id,
                label: 'Not found'
            });
        });
    }

    private addNamespaceMismatchMarkers(clusterNamespaces: string[], modelNamespaces: NamespaceNode[], markers: Marker[]): void {
        modelNamespaces.forEach(namespace => {
            if (!clusterNamespaces.includes(namespace.name)) {
                markers.push({
                    kind: MarkerKind.ERROR,
                    description: createErrorMessage('namespace', namespace.name, 'cluster'),
                    elementId: namespace.id,
                    label: 'Not found'
                });
            }
        });
    }
}
