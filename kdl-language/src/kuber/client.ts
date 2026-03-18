/********************************************************************************
 * Copyright (c) 2025-2026 Archer.
 ********************************************************************************/

import { GLSPServerError } from '@eclipse-glsp/server';
import * as k8s from '@kubernetes/client-node';
import { injectable } from 'inversify';
// import * as vscode from 'vscode';

export type KuberController = k8s.V1Deployment | k8s.V1ReplicaSet | k8s.V1StatefulSet;

@injectable()
export class KubeClient {
    protected kc: k8s.KubeConfig;
    protected k8sCoreApi: k8s.CoreV1Api;
    protected k8sAppApi: k8s.AppsV1Api;
    protected k8sNerwokingApi: k8s.NetworkingV1Api;

    constructor() {
        this.kc = new k8s.KubeConfig();
        this.kc.loadFromDefault();
        this.k8sCoreApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.k8sAppApi = this.kc.makeApiClient(k8s.AppsV1Api);
        this.k8sNerwokingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    }

    public async ping(): Promise<void> {
        try {
            // const pods = await this.k8sCoreApi.listNamespacedPod({ namespace: 'default' });
        } catch (err) {
            console.error(err);
        }
    }

    public async getNamespaces(): Promise<string[]> {
        try {
            const response = await this.k8sCoreApi.listNamespace();
            const namespaces = response.items
                .filter((item): item is { metadata: { name: string } } => item.metadata !== undefined && item.metadata.name !== undefined)
                .map(item => item.metadata.name)
                .filter(namespace => !namespace.startsWith('kube'));
            return namespaces;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get namespaces');
        }
    }

    public async getPods(namespace: string, selector?: string): Promise<k8s.V1Pod[]> {
        try {
            const pods = await this.k8sCoreApi.listNamespacedPod({ namespace: namespace, labelSelector: selector });
            // Map to store unique pods by deployment name
            const deploymentPodMap = new Map<string, k8s.V1Pod>();
            for (const pod of pods.items) {
                const ownerRefs = pod.metadata?.ownerReferences;
                if (!ownerRefs) continue;
                const rsOwner = ownerRefs.find(ref => ref.kind === 'ReplicaSet');
                if (!rsOwner) continue;
                // ReplicaSet name pattern: <deploymentName>-<random>
                const match = rsOwner.name.match(/^(.+)-[a-z0-9]{9,}$/);
                if (!match) continue;
                const deploymentName = match[1];
                if (!deploymentPodMap.has(deploymentName)) {
                    deploymentPodMap.set(deploymentName, pod);
                }
            }
            return Array.from(deploymentPodMap.values());
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    public async getPodController(pod: k8s.V1Pod, namespace: string): Promise<KuberController | undefined> {
        try {
            const ownerRefs = pod.metadata?.ownerReferences;

            if (ownerRefs) {
                for (const owner of ownerRefs) {
                    if (owner.kind === 'ReplicaSet') {
                        const rsResponse = await this.k8sAppApi.readNamespacedReplicaSet({ name: owner.name, namespace: namespace });
                        const rsOwnerRefs = rsResponse.metadata?.ownerReferences;

                        if (rsOwnerRefs) {
                            for (const rsOwner of rsOwnerRefs) {
                                switch (rsOwner.kind) {
                                    case 'Deployment':
                                        return await this.k8sAppApi.readNamespacedDeployment({ name: rsOwner.name, namespace: namespace });
                                    // case 'DaemonSet':
                                    //     return await this.k8sAppApi.readNamespacedDaemonSet({ name: rsOwner.name, namespace: namespace });
                                    case 'StatefulSet':
                                        return await this.k8sAppApi.readNamespacedStatefulSet({ name: rsOwner.name, namespace: namespace });
                                    case 'ReplicaSet':
                                        return await this.k8sAppApi.readNamespacedReplicaSet({ name: rsOwner.name, namespace: namespace });
                                }
                            }
                        }
                    }
                    if (owner.kind === 'StatefulSet') {
                        return await this.k8sAppApi.readNamespacedStatefulSet({ name: owner.name, namespace: namespace });
                    }
                }
            }
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
        return undefined;
    }

    public async getServices(namespace: string): Promise<k8s.V1Service[]> {
        try {
            const services = await this.k8sCoreApi.listNamespacedService({ namespace: namespace });
            return services.items;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    public async getIngresses(namespace: string): Promise<k8s.V1Ingress[]> {
        try {
            const ingresses = await this.k8sNerwokingApi.listNamespacedIngress({ namespace: namespace });
            return ingresses.items;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get ingresses');
        }
    }

    public async getNamespacedIngress(namespace: string, ingressName: string): Promise<k8s.V1Ingress> {
        try {
            const ingress = await this.k8sNerwokingApi.readNamespacedIngress({ name: ingressName, namespace: namespace });
            return ingress;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get ingress: ' + ingressName);
        }
    }

    public async getNamespacedService(namespace: string, serviceName: string): Promise<k8s.V1Service> {
        try {
            const service = await this.k8sCoreApi.readNamespacedService({ name: serviceName, namespace: namespace });
            return service;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get service: ' + serviceName);
        }
    }
}
