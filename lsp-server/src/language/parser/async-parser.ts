/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { LangiumCoreServices } from 'langium';
import { WorkerThreadAsyncParser } from 'langium/node';

const workerUrl = __dirname + '/language/parser/worker-thread.cjs';

export class KDLAsyncParser extends WorkerThreadAsyncParser {
   constructor(services: LangiumCoreServices) {
      super(services, workerUrl);
   }
}
