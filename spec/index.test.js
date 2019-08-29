import {rollup} from "rollup";
import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';

import rollupSharp from '../src';

process.chdir(__dirname)

const dest = "output/output.js"

describe('simple tests', () => {
  test('skips not included files', async() => {
    // given
    const s = rollupSharp();
  
    // when
    const val = await s.load('bla.txt');
  
    // then
    expect(val).toBe(null);
  });
});

describe('fixture tests', () => {
  afterAll(() => rimraf('output/', () => undefined))

  test('should process png', async () => {
    // when
    await run(['./fixtures/png.js']);

    // then
    const png = require('./output/output').default;
    expect(png.width).toBe(256);
    assertExists(path.join('output', png.url));
  });
})


function run(input, options) {
  const writeOptions = {
    format: 'es',
    file: dest
  }

  return rollup({
    input,
    plugins: [rollupSharp(options)],
  }).then(bundle => bundle.write(writeOptions))
}


function assertExists(name, shouldExist = true) {
  return new Promise((resolve, reject) => {
    fs.stat(name, (err, stats) => err ? reject(err) : resolve(stats))
  }).then(() => true, () => false)
    .then(exists => expect(exists).toBe(shouldExist))
}