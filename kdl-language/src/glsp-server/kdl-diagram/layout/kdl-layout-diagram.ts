import { GModelElement, GModelRoot, GNode } from '@eclipse-glsp/server';
import * as ast from '../../../language-server/generated/ast.js';
import { KDLDiagram } from '../../../language-server/generated/ast.js';
import { CrossModelIndex } from '../../common/cross-model-index.js';

export class KDLLayoutDiagram {
    private kdlDiagram: KDLDiagram;
    private nodeAttrMapping: Map<ast.NodeType, ast.NodeAttribute> = new Map();
    private kdlIndex: CrossModelIndex;
    private podPaddingWidth = 30;
    private podPaddingHeight = 30;
    private containerPaddingWidth = 30;
    private containerPaddingHeight = 10;
    private ingressPaddingWidth = 30;
    private volumePaddingHeight = 5;
    private labelHeight = 30;
    private portPaddingWidth = 5;
    private podServicePaddingHeight = 10;

    constructor(kdlDiagram: KDLDiagram, kdlIndex: CrossModelIndex) {
        this.kdlDiagram = kdlDiagram;
        this.kdlDiagram.diagram?.nodeAttributes.forEach(attr => {
            if (!attr.nodeID.ref) {
                return;
            }
            this.nodeAttrMapping.set(attr.nodeID.ref, attr);
        });
        this.kdlIndex = kdlIndex;
    }

    layout(root: GModelRoot): void {
        this.applyGModelToDiagram(root);
        this.kdlDiagram.clusters.forEach(cluster => this.layoutCluster(cluster));
    }

    private applyGModelToDiagram(root: GModelElement): void {
        root.children.forEach(child => {
            const node = this.kdlIndex.findSemanticElement(child.id, ast.isNodeType);
            if (node){
                const nodeAttr = this.nodeAttrMapping.get(node);
                if (nodeAttr && (child instanceof GNode)) {
                    nodeAttr.dimensions.x = child.position.x;
                    nodeAttr.dimensions.y = child.position.y;
                    nodeAttr.dimensions.width = child.size.width;
                    nodeAttr.dimensions.height = child.size.height;
                }
            }
            this.applyGModelToDiagram(child);
        });
    }

    private layoutCluster(cluster: ast.ClusterNode): void {
        cluster.pods.forEach(pod => {
            const podAttr = this.nodeAttrMapping.get(pod);
            this.layoutChildrenHorizontal(pod.containers, this.containerPaddingWidth, this.containerPaddingHeight);
            if (podAttr) {
                const maxContainerSize = this.getMaxChildrenHeight(pod.containers);
                podAttr.dimensions.width = Math.max(
                    this.getWidthByChildren(pod.containers, this.containerPaddingWidth),
                    podAttr.dimensions.width
                );
                podAttr.dimensions.height = maxContainerSize.height + this.containerPaddingHeight * 2 + this.labelHeight;
                this.layoutChildrenOnRightBorder(pod.volumes, podAttr);
                this.layoutChildrenOnTopBorder(pod.ports, podAttr, this.portPaddingWidth);
                this.layoutChildrenOnLeftBorder([pod.controller, pod.cardinality], podAttr);
            }
        });

        cluster.services.forEach(service => {
            const serviceAttr = this.nodeAttrMapping.get(service);
            if (!serviceAttr){
                return;
            }
            this.layoutChildrenOnTopBorder(service.ports, serviceAttr, this.portPaddingWidth);
            this.layoutChildrenOnLeftBorder([service.type], serviceAttr);
        });

        const clusterAttr = this.nodeAttrMapping.get(cluster);
        if (!clusterAttr){
            return;
        }
        this.layoutChildrenHorizontal(cluster.pods, this.podPaddingWidth, this.podPaddingHeight);
        this.layoutChildrenHorizontal(cluster.services, this.podPaddingWidth, this.podPaddingHeight);
        this.layoutCenterChildrenOnTopBorder(cluster.ingresses, clusterAttr, this.ingressPaddingWidth);
        this.shiftServiceUnderIngresses(cluster.services, cluster.ingresses);
        this.shiftPodsUnderServices(cluster.pods, cluster.services);
        if (clusterAttr) {
            const maxPodHeight = this.getMaxChildrenHeight(cluster.pods);
            clusterAttr.dimensions.width = this.getWidthByChildren(cluster.pods, this.podPaddingWidth);
            clusterAttr.dimensions.height = maxPodHeight.y + maxPodHeight.height + this.podPaddingHeight + this.labelHeight;
        }
    }

    private getMaxChildrenHeight(children: ast.NodeType[]): { height: number; y: number } {
        let maxHeight = 0;
        let maxY = 0;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                if (attr.dimensions.height > maxHeight) {
                    maxHeight = attr.dimensions.height;
                    maxY = attr.dimensions.y;
                }
            }
        });
        return { height: maxHeight, y: maxY };
    }

    private layoutChildrenHorizontal(children: ast.NodeType[], paddingWidth: number, paddingHeight: number): void {
        let x = paddingWidth;
        let y = paddingHeight;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                attr.dimensions.x = x;
                attr.dimensions.y = y;
                x += attr.dimensions.width + paddingWidth;
            }
        });
    }
    private getWidthByChildren(children: ast.NodeType[], paddingWidth: number): number {
        let width = paddingWidth;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                width += attr.dimensions.width + paddingWidth;
            }
        });
        return width;
    }

    private layoutCenterChildrenOnTopBorder(children: ast.NodeType[], parentAttr: ast.NodeAttribute, paddingWidth: number): void {
        let x = 0;
        let y = 0;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                attr.dimensions.x = x + paddingWidth;
                attr.dimensions.y = y - this.labelHeight - attr.dimensions.height / 2;
                x += attr.dimensions.width + paddingWidth;
            }
        });
        parentAttr.dimensions.width = Math.max(parentAttr.dimensions.width, x + paddingWidth);
    }

    private layoutChildrenOnTopBorder(children: ast.NodeType[], parentAttr: ast.NodeAttribute, paddingWidth: number): void {
        let x = 0;
        let y = -this.labelHeight;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                attr.dimensions.x = x + paddingWidth;
                attr.dimensions.y = y - attr.dimensions.height;
                x += attr.dimensions.width + paddingWidth;
            }
        });
        parentAttr.dimensions.width = Math.max(parentAttr.dimensions.width, x + paddingWidth);
    }

    private layoutChildrenOnRightBorder(children: ast.NodeType[], parentAttr: ast.NodeAttribute): void {
        let x = parentAttr.dimensions.width - this.labelHeight / 2;
        let y = 0 - this.labelHeight;
        children.forEach(child => {
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                attr.dimensions.x = x;
                attr.dimensions.y = y + this.volumePaddingHeight;
                y += attr.dimensions.height + this.volumePaddingHeight;
            }
        });
        parentAttr.dimensions.height = Math.max(parentAttr.dimensions.height, y + this.volumePaddingHeight + this.labelHeight);
    }

    private layoutChildrenOnLeftBorder(children: (ast.NodeType | undefined)[], parentAttr: ast.NodeAttribute): void {
        let x = 0;
        let y = 0 - this.labelHeight;
        for (const child of children) {
            if (!child) {
                continue;
            }
            const attr = this.nodeAttrMapping.get(child);
            if (attr) {
                attr.dimensions.x = x - attr.dimensions.width;
                attr.dimensions.y = y;
                y += attr.dimensions.height + this.volumePaddingHeight;
            }
        }
        parentAttr.dimensions.height = Math.max(parentAttr.dimensions.height, y + this.volumePaddingHeight);
    }

    private shiftPodsUnderServices(pods: ast.PodNode[], services: ast.ServiceNode[]): void {
        let y = 0;
        services.forEach(service => {
            const serviceAttr = this.nodeAttrMapping.get(service);
            if (serviceAttr) {
                y = Math.max(y, serviceAttr.dimensions.y + serviceAttr.dimensions.height + this.podPaddingHeight);
            }
        });
        const podPorts = pods.map(pod => pod.ports).flat();
        y += this.getMaxChildrenHeight(podPorts).height + this.podServicePaddingHeight;
        pods.forEach(pod => {
            const podAttr = this.nodeAttrMapping.get(pod);
            if (podAttr) {
                podAttr.dimensions.y = y;
            }
        });
    }

    private shiftServiceUnderIngresses(services: ast.ServiceNode[], ingresses: ast.IngressNode[]): void {
        let y = 0;
        ingresses.forEach(ingress => {
            const ingressAttr = this.nodeAttrMapping.get(ingress);
            if (ingressAttr) {
                y = Math.max(y, ingressAttr.dimensions.y + ingressAttr.dimensions.height + this.podPaddingHeight);
            }
        });
        const servicePorts = services.map(service => service.ports).flat();
        y += this.getMaxChildrenHeight(servicePorts).height + this.podServicePaddingHeight;
        services.forEach(service => {
            const serviceAttr = this.nodeAttrMapping.get(service);
            if (serviceAttr) {
                serviceAttr.dimensions.y = y;
            }
        });
    }
}
