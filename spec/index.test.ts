const rimraf = require('rimraf');

import { rollup, OutputOptions } from 'rollup';
import { stat, readFile } from 'fs';
import { join } from 'path';

import rollupSharp, { SharpOptions } from '../src';
import { promise } from '../src/helper';

process.chdir(__dirname);

const dest = 'output/output.js';
const pngHash = 'f7636591ce3b1e0d';

afterEach(done => rimraf('output/', done));

describe('simple tests', () => {
  test('skips not included files', async () => {
    // given
    const s = rollupSharp();

    // when
    const val = await s.load.bind(s)('bla.txt');

    // then
    expect(val).toBe(null);
  });
});

describe('fixture tests', () => {
  test('should process png', async () => {
    // when
    await run(['./fixtures/fixture.js']);

    // then
    assertExists(join('output', `png.${pngHash}.png`));
  });

  test('should include publicPath', async () => {
    // given
    const publicPath = '/my-app/';

    // when
    await run(['./fixtures/fixture.js'], { publicPath });

    // then
    assertContains(`src: '/my-app/png.${pngHash}.png'`);
  });

  test('should respect fileName', async () => {
    // given
    const fileName = '[hash][extname]';

    // when
    await run(['./fixtures/fixture.js'], { fileName });

    // then
    assertExists(join('output', `${pngHash}.png`));
    assertContains(`src: '${pngHash}.png`);
  });
});

function run(input, options: SharpOptions = {}) {
  const writeOptions: OutputOptions = {
    format: 'es',
    file: dest
  };

  return rollup({
    input,
    plugins: [rollupSharp(options)]
  }).then(bundle => bundle.write(writeOptions));
}

function assertContains(content, file = dest) {
  promise(readFile, file, 'utf-8').then(fileContent =>
    expect(fileContent).toContain(content)
  );
}

function assertExists(name, shouldExist = true) {
  promise(stat, name)
    .then(() => true, () => false)
    .then(exists => expect(exists).toBe(shouldExist));
}
