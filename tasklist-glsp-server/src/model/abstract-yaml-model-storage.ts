/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { injectable, inject } from 'inversify';
import {
    GLSPServerError,
    MaybePromise,
    ModelState,
    RequestModelAction,
    SaveModelAction,
    SOURCE_URI_ARG,
    SourceModelStorage,
    TypeGuard
} from '@eclipse-glsp/server';

@injectable()
export abstract class AbstractYamlModelStorage implements SourceModelStorage {
    @inject(ModelState)
    protected modelState: ModelState;

    abstract loadSourceModel(action: RequestModelAction): MaybePromise<void>;
    abstract saveSourceModel(action: SaveModelAction): MaybePromise<void>;

    protected getSourceUri(action: RequestModelAction): string {
        const sourceUri = action.options?.[SOURCE_URI_ARG];
        if (typeof sourceUri !== 'string') {
            throw new GLSPServerError(`Invalid RequestModelAction! Missing argument with key '${SOURCE_URI_ARG}'`);
        }
        return sourceUri;
    }
    protected loadFromFile(sourceUri: string): unknown;
    protected loadFromFile<T>(sourceUri: string, guard: TypeGuard<T>): T;
    protected loadFromFile<T>(sourceUri: string, guard?: TypeGuard<T>): T | unknown {
        try {
            const path = this.toPath(sourceUri);
            let fileContent = this.readFile(path);
            if (!fileContent) {
                fileContent = this.createModelForEmptyFile(path);
                if (!fileContent) {
                    throw new GLSPServerError(`Could not load the source model. The file '${path}' is empty!`);
                }
            }
            if (guard && !guard(fileContent)) {
                throw new Error('The loaded root object is not of the expected type!');
            }
            return fileContent;
        } catch (error) {
            throw new GLSPServerError(`Could not load model from file: ${sourceUri}`, error);
        }
    }

    protected createModelForEmptyFile(path: string): unknown | undefined {
        return undefined;
    }

    protected readFile(path: string): unknown | undefined {
        try {
            const data = fs.readFileSync(path, { encoding: 'utf8' });
            if (!data || data.length === 0) {
                return undefined;
            }
            return this.toYaml(data);
        } catch (error) {
            throw new GLSPServerError(`Could not read & parse file contents of '${path}' as YAML`, error);
        }
    }

    protected toYaml(fileContent: string): unknown {
        return yaml.parse(fileContent);
    }

    protected toPath(sourceUri: string): string {
        let path = sourceUri.startsWith('file://') ? fileURLToPath(sourceUri) : sourceUri;
        if (os.platform() === 'win32') {
            path = path.replace(/^\//, '');
        }
        return path;
    }

    protected getFileUri(action: SaveModelAction): string {
        const uri = action.fileUri ?? this.modelState.get(SOURCE_URI_ARG);
        if (!uri) {
            throw new GLSPServerError('Could not derive fileUri for saving the current source model');
        }
        return uri;
    }

    protected writeFile(fileUri: string, model: unknown): void {
        const path = this.toPath(fileUri);
        const content = this.toString(model);
        fs.writeFileSync(path, content);
    }

    protected toString(model: unknown): string {
        return yaml.stringify(model);
    }
}
