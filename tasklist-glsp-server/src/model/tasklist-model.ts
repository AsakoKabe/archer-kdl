/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/

import { AnyObject, DefaultTypes, hasArrayProp, hasObjectProp, hasStringProp, Point } from '@eclipse-glsp/server';
import { ModelTypes } from '../utils/model-types';
import { ClusterNode } from './cluster-node';
import { ContainerNode } from './container-node';
import { IngressNode } from './ingress-node';
import { PodNode } from './pod-node';
import { PortNode } from './port-node';
import { ServiceNode } from './service-node';
import * as uuid from 'uuid';

export interface TaskList {
    id: string;
    links: Link[];
    clusters: Cluster[];
    ingresses: Ingress[];
    pods: Pod[];
    services: Service[];
    containers: Container[];
    ports: Port[];
}

export namespace TaskList {
    export function is(object: any): object is TaskList {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasArrayProp(object, 'links') &&
            hasArrayProp(object, 'clusters') &&
            hasArrayProp(object, 'ingresses') &&
            hasArrayProp(object, 'pods') &&
            hasArrayProp(object, 'services') &&
            hasArrayProp(object, 'containers') &&
            hasArrayProp(object, 'ports')
        );
    }
}

export interface Link extends KDLBaseElement {
    sourceId: string;
    targetId: string;
    routingPoints: Point[];
}

export namespace Link {
    export function is(object: any): object is Link {
        return (
            AnyObject.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'sourceId') &&
            hasStringProp(object, 'targetId') &&
            hasArrayProp(object, 'routingPoints') &&
            object.type === DefaultTypes.EDGE
        );
    }

    export function create(sourceId: string, targetId: string): Link {
        return {
            id: uuid.v4(),
            type: DefaultTypes.EDGE,
            sourceId: sourceId,
            targetId: targetId,
            routingPoints: []
        };
    }
}

export interface Cluster extends KDLBaseElement, KDLShapeElement {
    name: string;
    ingress_ids: string[];
    pod_ids: string[];
    service_ids: string[];
}

export namespace Cluster {
    export function is(object: any): object is Cluster {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            hasArrayProp(object, 'ingress_ids') &&
            hasArrayProp(object, 'pod_ids') &&
            hasArrayProp(object, 'service_ids') &&
            object.type === ModelTypes.CLUSTER
        );
    }

    export function createFromNode(clusterNode: ClusterNode): Cluster {
        return {
            id: clusterNode.id,
            name: clusterNode.name,
            position: clusterNode.position,
            size: clusterNode.size,
            type: clusterNode.nodeType,
            ingress_ids: [],
            pod_ids: [],
            service_ids: []
        };
    }

    export function create(name: string): Cluster {
        return {
            id: uuid.v4(),
            name: name,
            position: { x: 0, y: 0 },
            // size: {width: 100, height: 100},
            type: ModelTypes.CLUSTER,
            ingress_ids: [],
            pod_ids: [],
            service_ids: []
        };
    }
}

export interface KDLBaseElement {
    id: string;
    type: string;
}

export namespace KDLBaseElement {
    export function is(object: any): object is KDLBaseElement {
        return AnyObject.is(object) && hasStringProp(object, 'id') && hasStringProp(object, 'type');
    }
}

export interface KDLShapeElement {
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace KDLShapeElement {
    export function is(object: any): object is KDLShapeElement {
        return AnyObject.is(object) && hasObjectProp(object, 'position');
    }
}

export interface Ingress extends KDLBaseElement, KDLShapeElement {
    name: string;
    host: string;
}

export namespace Ingress {
    export function is(object: any): object is Ingress {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            hasStringProp(object, 'host') &&
            object.type === ModelTypes.INGRESS
        );
    }

    export function createFromNode(ingressNode: IngressNode): Ingress {
        return {
            id: ingressNode.id,
            name: ingressNode.name,
            host: ingressNode.host,
            position: ingressNode.position,
            size: ingressNode.size,
            type: ingressNode.nodeType
        };
    }

    export function create(host: string, name?: string): Ingress {
        const ingressName = name ? name : 'ingressName';
        return {
            id: uuid.v4(),
            name: ingressName,
            host: host,
            position: { x: 0, y: 0 },
            // size: { width: 100, height: 100 },
            type: ModelTypes.INGRESS
        };
    }
}

export interface Pod extends KDLBaseElement, KDLShapeElement {
    name: string;
    container_ids: string[];
    port_ids: string[];
}

export namespace Pod {
    export function is(object: any): object is Pod {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            hasArrayProp(object, 'container_ids') &&
            hasArrayProp(object, 'port_ids') &&
            object.type === ModelTypes.POD
        );
    }

    export function createFromNode(podNode: PodNode): Pod {
        return {
            id: podNode.id,
            name: podNode.name,
            position: podNode.position,
            size: podNode.size,
            type: podNode.nodeType,
            container_ids: [],
            port_ids: []
        };
    }

    export function create(name?: string): Pod {
        const podName = name ? name : 'podName';
        return {
            id: uuid.v4(),
            name: podName,
            position: { x: 0, y: 0 },
            // size: { width: 100, height: 100 },
            type: ModelTypes.POD,
            container_ids: [],
            port_ids: []
        };
    }
}

export interface Service extends KDLBaseElement, KDLShapeElement {
    name: string;
    port_ids: string[];
}

export namespace Service {
    export function is(object: any): object is Service {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            hasArrayProp(object, 'port_ids') &&
            object.type === ModelTypes.SERVICE
        );
    }

    export function createFromNode(serviceNode: ServiceNode): Service {
        return {
            id: serviceNode.id,
            name: serviceNode.name,
            position: serviceNode.position,
            size: serviceNode.size,
            type: serviceNode.nodeType,
            port_ids: []
        };
    }

    export function create(name?: string): Service {
        const serviceName = name ? name : 'serviceName';
        return {
            id: uuid.v4(),
            name: serviceName,
            position: { x: 0, y: 0 },
            size: { width: 120, height: 40 },
            type: ModelTypes.SERVICE,
            port_ids: []
        };
    }
}

export interface Container extends KDLBaseElement, KDLShapeElement {
    name: string;
}

export namespace Container {
    export function is(object: any): object is Container {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            object.type === ModelTypes.CONTAINER
        );
    }

    export function createFromNode(containerNode: ContainerNode): Container {
        return {
            id: containerNode.id,
            name: containerNode.name,
            position: containerNode.position,
            size: containerNode.size,
            type: containerNode.nodeType
        };
    }

    export function create(name: string): Container {
        return {
            id: uuid.v4(),
            name: name,
            position: { x: 0, y: 0 },
            // size: { width: 100, height: 100 },
            type: ModelTypes.CONTAINER
        };
    }
}

export interface Port extends KDLBaseElement, KDLShapeElement {
    name: string;
    number: string;
}

export namespace Port {
    export function is(object: any): object is Port {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            hasStringProp(object, 'number') &&
            object.type === ModelTypes.PORT
        );
    }

    export function createFromNode(portNode: PortNode): Port {
        return {
            id: portNode.id,
            name: portNode.name,
            number: portNode.number,
            position: portNode.position,
            size: portNode.size,
            type: portNode.nodeType
        };
    }

    export function create(number: string, name?: string): Port {
        const portName = name ? name : 'portName';
        return {
            id: uuid.v4(),
            name: portName,
            number: number,
            position: { x: 0, y: 0 },
            // size: { width: 100, height: 100 },
            type: ModelTypes.PORT
        };
    }
}
