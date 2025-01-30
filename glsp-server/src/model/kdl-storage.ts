import { MaybePromise, RequestModelAction, SaveModelAction } from '@eclipse-glsp/server/node';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { AbstractYamlModelStorage } from './abstract-yaml-model-storage';
import { KDL } from './kdl-model';
import { KDLModelState } from './kdl-model-state';

@injectable()
export class KDLStorage extends AbstractYamlModelStorage {
    @inject(KDLModelState)
    protected override modelState: KDLModelState;

    loadSourceModel(action: RequestModelAction): MaybePromise<void> {
        const sourceUri = this.getSourceUri(action);
        console.error('loadSourceModel', sourceUri);

        const kdl = this.loadFromFile(sourceUri, KDL.is);
        this.modelState.updateSourceModel(kdl);
    }

    saveSourceModel(action: SaveModelAction): MaybePromise<void> {
        const sourceUri = this.getFileUri(action);
        console.error('saveSourceModel', sourceUri);

        this.writeFile(sourceUri, this.modelState.sourceModel);
    }

    protected override createModelForEmptyFile(path: string): KDL {
        console.error('createModelForEmptyFile', path);
        return {
            id: uuid.v4(),
            links: [],
            clusters: [],
            ingresses: [],
            pods: [],
            services: [],
            containers: [],
            ports: []
        };
    }
}
