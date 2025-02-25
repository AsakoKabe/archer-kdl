import { Marker } from '@eclipse-glsp/server';

export interface Validator<T> {
    validate(element: T): Promise<Marker[]>;
}

export function createErrorMessage(entity: string, name: string, context: string): string {
    const otherContext = context === 'model' ? 'cluster' : 'model';
    return `"${name}" ${entity} does not found in ${context}, but it exists in the ${otherContext}`;
}
