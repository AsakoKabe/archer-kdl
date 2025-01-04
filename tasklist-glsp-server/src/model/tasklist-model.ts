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

import { AnyObject, hasArrayProp, hasObjectProp, hasStringProp } from '@eclipse-glsp/server';
import { ClusterNode } from './cluster-node';
import { ModelTypes } from '../utils/model-types';
import { IngressNode } from './ingress-node';

/**
 * The source model for `tasklist` GLSP diagrams. A `TaskList` is a
 * plain JSON objects that contains a set of {@link Task tasks} and {@link Transition transitions}.
 */
export interface TaskList {
    id: string;
    tasks: Task[];
    transitions: Transition[];
    clusters: Cluster[];
    ingresses: Ingress[];
}

export namespace TaskList {
    export function is(object: any): object is TaskList {
        return AnyObject.is(object) && hasStringProp(object, 'id') && hasArrayProp(object, 'tasks');
    }
}

export interface Task extends KDLBaseElement, KDLShapeElement {
    name: string;
}

export namespace Task {
    export function is(object: any): object is Task {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            object.nodeType === ModelTypes.TASK
        );
    }
}

export interface Transition {
    id: string;
    sourceTaskId: string;
    targetTaskId: string;
}

export namespace Transition {
    export function is(object: any): object is Transition {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'sourceTaskId') &&
            hasStringProp(object, 'targetTaskId')
        );
    }
}

export interface Cluster extends KDLBaseElement, KDLShapeElement {
    name: string;
}

export namespace Cluster {
    export function is(object: any): object is Cluster {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            object.nodeType === ModelTypes.CLUSTER
        );
    }

    export function createFromNode(clusterNode: ClusterNode): Cluster {
        return {
            id: clusterNode.id,
            name: clusterNode.name,
            position: clusterNode.position,
            size: clusterNode.size,
            nodeType: clusterNode.nodeType
        };
    }
}

export interface KDLBaseElement {
    id: string;
    nodeType: string;
}

export namespace KDLBaseElement {
    export function is(object: any): object is KDLBaseElement {
        return AnyObject.is(object) && hasStringProp(object, 'id') && hasStringProp(object, 'nodeType');
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
}

export namespace Ingress {
    export function is(object: any): object is Ingress {
        return (
            AnyObject.is(object) &&
            KDLShapeElement.is(object) &&
            KDLBaseElement.is(object) &&
            hasStringProp(object, 'name') &&
            object.nodeType === ModelTypes.INGRESS
        );
    }

    export function createFromNode(ingressNode: IngressNode): Ingress {
        return {
            id: ingressNode.id,
            name: ingressNode.name,
            position: ingressNode.position,
            size: ingressNode.size,
            nodeType: ingressNode.nodeType
        };
    }
}