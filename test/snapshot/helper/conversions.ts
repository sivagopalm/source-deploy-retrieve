/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import snap from 'mocha-snap';
import { MetadataConverter } from '../../../src/convert/metadataConverter';
import { ComponentSetBuilder } from '../../../src/collections/componentSetBuilder';

const converter = new MetadataConverter();

/** common function to standardize snapshot behavior */
export const fileSnap = async (file: string, testDir: string) =>
  shouldIgnore(file) ? void 0 : snap(fs.readFileSync(file, 'utf8'), { dir: testDir, file });

/**
 * converts a project's `originalMdapi` directory to source format
 * returns a list of all the files in the converted project
 */
export const mdapiToSource = async (testDir: string): Promise<string[]> => {
  const cs = await ComponentSetBuilder.build({
    sourcepath: [path.join(testDir, 'originalMdapi')],
  });
  await converter.convert(cs, 'source', {
    type: 'directory',
    outputDirectory: path.join(testDir, 'force-app'),
    genUniqueDir: false,
  });
  const dirEnts = await fs.promises.readdir(path.join(testDir, 'force-app'), {
    recursive: true,
    withFileTypes: true,
  });

  return dirEntsToPaths(dirEnts);
};

export const sourceToMdapi = async (testDir: string): Promise<string[]> => {
  // cs from the entire project
  const cs = await ComponentSetBuilder.build({
    sourcepath: [path.join(testDir, 'force-app')],
  });
  await converter.convert(cs, 'metadata', {
    type: 'directory',
    outputDirectory: path.join(testDir, 'mdapiOutput'),
    genUniqueDir: false,
  });
  const dirEnts = await fs.promises.readdir(path.join(testDir, 'mdapiOutput'), {
    recursive: true,
    withFileTypes: true,
  });

  return dirEntsToPaths(dirEnts);
};

/** dirEnts are sometimes folder, we don't want those.  And we need the full paths */
const dirEntsToPaths = (dirEnts: fs.Dirent[]): string[] =>
  dirEnts.filter((file) => file.isFile()).map((file) => path.join(file.path, file.name));

const shouldIgnore = (file: string): boolean => {
  // binary zip/unzip isn't exactly the same, so we "skip" that one
  if (file.includes('leafletjs.resource')) return true;
  return false;
};
