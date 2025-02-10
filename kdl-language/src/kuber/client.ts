import { injectable } from 'inversify';
import * as k8s from '@kubernetes/client-node';
import { GLSPServerError } from '@eclipse-glsp/server';

@injectable()
export class KuberClient {
    protected kc: k8s.KubeConfig;
    protected k8sApi: k8s.CoreV1Api;
    protected k8sNerwokingApi: k8s.NetworkingV1Api;

    constructor() {
        this.kc = new k8s.KubeConfig();
        this.kc.loadFromDefault();
        this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
        this.k8sNerwokingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    }

    // public async ping(): Promise<void> {
    //     try {
    //         const pods = await this.k8sApi.listNamespacedPod({ namespace: 'default' });
    //         console.error('Pods: ', pods.items);
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }

    public async getNamespaces(): Promise<string[]> {
        try {
            const response = await this.k8sApi.listNamespace();
            const namespaces = response.items
                .filter((item): item is { metadata: { name: string } } => item.metadata !== undefined && item.metadata.name !== undefined)
                .map(item => item.metadata.name);
            return namespaces;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get namespaces');
        }
    }

    public async getPods(namespace: string, selector?: string): Promise<k8s.V1PodList> {
        try {
            const pods = await this.k8sApi.listNamespacedPod({ namespace: namespace, labelSelector: selector });
            return pods;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get pods');
        }
    }

    public async getServices(namespace: string): Promise<k8s.V1ServiceList> {
        try {
            const services = await this.k8sApi.listNamespacedService({ namespace: namespace });
            return services;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get services');
        }
    }

    public async getIngresses(namespace: string): Promise<k8s.V1IngressList> {
        try {
            const ingresses = await this.k8sNerwokingApi.listNamespacedIngress({ namespace: namespace });
            return ingresses;
        } catch (err) {
            throw new GLSPServerError('Error to send k8s request to get ingresses');
        }
    }
}
