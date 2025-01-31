/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import fs from 'fs';
import path from 'path';
import { KDLRoot } from '../language/generated/ast.js';
import { extractDestinationAndName } from './cli-util.js';
import { CompositeGeneratorNode, NL, toString } from 'langium/generate';

export function generateJavaScript(root: KDLRoot, filePath: string, destination: string | undefined): string {
   const data = extractDestinationAndName(filePath, destination);
   const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

   const fileNode = new CompositeGeneratorNode();
   fileNode.append('"use strict";', NL, NL);
   fileNode.append(JSON.stringify(root), NL);

   if (!fs.existsSync(data.destination)) {
      fs.mkdirSync(data.destination, { recursive: true });
   }
   fs.writeFileSync(generatedFilePath, toString(fileNode));
   return generatedFilePath;
}
