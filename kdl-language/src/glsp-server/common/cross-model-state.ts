/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultModelState, JsonModelState, ModelState, hasFunctionProp } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DocumentState } from 'langium';
import { URI } from 'vscode-uri';
import { KDLLSPServices } from '../../integration.js';
import { IdProvider } from '../../language-server/kdl-naming.js';
import { KDLRoot } from '../../language-server/generated/ast.js';
import { ModelService } from '../../model-server/model-service.js';
import { Serializer } from '../../model-server/serializer.js';
import { CrossModelIndex } from './cross-model-index.js';

export interface CrossModelSourceModel {
   text: string;
}

/**
 * Custom model state that does not only keep track of the GModel root but also the semantic root.
 * It also provides convenience methods for accessing specific language services.
 */
@injectable()
export class CrossModelState extends DefaultModelState implements JsonModelState<CrossModelSourceModel> {
   @inject(CrossModelIndex) declare readonly index: CrossModelIndex;
   @inject(KDLLSPServices) readonly services!: KDLLSPServices;

   protected _semanticUri!: string;
   protected _semanticRoot!: KDLRoot;
   protected _packageId!: string;

   setSemanticRoot(uri: string, semanticRoot: KDLRoot): void {
      this._semanticUri = uri;
      this._semanticRoot = semanticRoot;
      this._packageId = this.services.shared.workspace.PackageManager.getPackageIdByUri(URI.parse(uri));
      this.index.indexSemanticRoot(this.semanticRoot);
   }

   get semanticUri(): string {
      return this._semanticUri;
   }

   get semanticRoot(): KDLRoot {
      return this._semanticRoot;
   }

   get packageId(): string {
      return this._packageId;
   }

   get modelService(): ModelService {
      return this.services.shared.model.ModelService;
   }

   get semanticSerializer(): Serializer<KDLRoot> {
      return this.services.language.serializer.Serializer;
   }

   get idProvider(): IdProvider {
      return this.services.language.references.IdProvider;
   }

   get sourceModel(): CrossModelSourceModel {
      return { text: this.semanticText() };
   }

   async updateSourceModel(sourceModel: CrossModelSourceModel): Promise<void> {
      const document = await this.modelService.update({
         uri: this.semanticUri,
         model: sourceModel.text ?? this.semanticRoot,
         clientId: this.clientId
      });
      this._semanticRoot = document.root;
      this.index.indexSemanticRoot(this.semanticRoot);
   }

   /** Textual representation of the current semantic root. */
   semanticText(): string {
      return this.services.language.serializer.Serializer.serialize(this.semanticRoot);
   }

   ready(state = DocumentState.Validated): Promise<void> {
      return this.modelService.ready(state, this.semanticUri);
   }
}

export namespace CrossModelState {
   export function is(modelState: ModelState): modelState is CrossModelState {
      return JsonModelState.is(modelState) && hasFunctionProp(modelState, 'setSemanticRoot');
   }
}
