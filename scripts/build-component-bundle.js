#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const [, , inputDirArg, outputArg, rootKeyArg] = process.argv;

  if ( !inputDirArg ) {
    console.error('Usage: node scripts/build-component-bundle.js <componentsDir> [outputFile] [rootKey]');
    process.exit(1);
  }

  const inputDir = path.resolve(process.cwd(), inputDirArg);
  const outputFile = outputArg ? path.resolve(process.cwd(), outputArg) : path.join(inputDir, 'components.bundle.json');
  const rootKey = rootKeyArg || 'components';

  const stats = await fs.stat(inputDir).catch(() => null);
  if ( !stats || !stats.isDirectory() ) {
    console.error(`Input directory '${inputDir}' must exist and be a directory.`);
    process.exit(1);
  }

  await fs.mkdir(path.dirname(outputFile), {recursive: true});

  const ignore = new Set();
  const relativeOutput = path.relative(inputDir, outputFile);
  if ( relativeOutput && !relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput) ) {
    const normalized = relativeOutput.split(path.sep).join('/');
    ignore.add(normalized);
  }

  const tree = await buildTree(inputDir, {ignore, prefix: ''});
  const bundle = {[rootKey]: tree};

  await fs.writeFile(outputFile, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`Component bundle written to ${outputFile}`);
}

async function buildTree(dir, {ignore, prefix}) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const result = {};

  for ( const entry of entries ) {
    const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
    if ( ignore && ignore.has(relativeName) ) continue;
    const entryPath = path.join(dir, entry.name);

    if ( entry.isDirectory() ) {
      result[entry.name] = await buildTree(entryPath, {ignore, prefix: relativeName});
    } else if ( entry.isFile() ) {
      const data = await fs.readFile(entryPath);
      result[entry.name] = data.toString('base64');
    }
  }

  return result;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
