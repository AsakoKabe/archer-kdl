/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { EmptyFileSystem } from 'langium';
import { parentPort } from 'node:worker_threads';
import { createKDLServices } from '../kdl-module.js';

const services = createKDLServices(EmptyFileSystem).KDL;
const parser = services.parser.LangiumParser;
const hydrator = services.serializer.Hydrator;

parentPort?.on('message', text => {
    const result = parser.parse(text);
    const dehydrated = hydrator.dehydrate(result);
    parentPort?.postMessage(dehydrated);
});
