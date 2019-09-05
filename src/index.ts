const sharp = require('sharp');
const mkpath = require('mkpath');

import { readFile, copyFileSync, copyFile } from 'fs';
import { createFilter } from 'rollup-pluginutils';
import { lookup } from 'mime-types';
import { join, dirname, extname, basename } from 'path';
import { createHash } from 'crypto';
import { OutputOptions, Plugin, OutputBundle } from 'rollup';
import { promise } from './helper';

const defaultInclude = ['**/*.png', '**/*.jpg', '**/*.gif'];

export interface SharpOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  publicPath?: string;
  destDir?: string;
  minifiedWidth?: number;
  fileName?: string;
}

export default function rollupSharp(options: SharpOptions = {}): Plugin {
  const {
    include = defaultInclude,
    exclude,
    publicPath = '',
    minifiedWidth = 20,
    fileName = '[name].[hash][extname]'
  }: SharpOptions = options;

  const filter = createFilter(include, exclude);
  const copies = {};

  return {
    name: 'rollup-plugin-sharp',
    load: async function(id: string) {
      if (!filter(id)) {
        return null;
      }

      const mimeType = lookup(id);
      const imageBuffer: Buffer = await promise(readFile, id);

      const [{ file, info }, { url, name }] = await Promise.all([
        resize(imageBuffer, minifiedWidth),
        createImageUrl(id, imageBuffer, publicPath, fileName)
      ]);

      copies[id] = name;

      return `
        export default {
            placeholder: 'data:${mimeType};base64,${file}',
            src: '${url}',
            width: ${info.width},
            height: ${info.height}
        }`;
    },

    generateBundle: async function(
      outputOptions: OutputOptions,
      bundle: OutputBundle
    ): Promise<void> {
      const base =
        options.destDir || outputOptions.dir || dirname(outputOptions.file);

      await promise(mkpath, base);

      return Promise.all(
        Object.keys(copies).map(async name => {
          const output = copies[name];
          const outputDirectory = join(base, dirname(output));
          await promise(mkpath, outputDirectory);
          // TODO: Different sizes (#1)
          sharp(name).toFile(join(base, output));
        })
      ).then(() => undefined);
    }
  };
}

async function createImageUrl(
  image: string,
  imageBuffer: Buffer,
  publicPath: string,
  fileName: string
): Promise<{ url: string; name: string }> {
  const hash = createHash('sha1')
    .update(imageBuffer)
    .digest('hex')
    .substr(0, 16);

  const ext = extname(image);
  const name = basename(image, ext);
  const outputFileName = fileName
    .replace(/\[hash\]/g, hash)
    .replace(/\[extname\]/g, ext)
    .replace(/\[name\]/g, name);

  return { url: `${publicPath}${outputFileName}`, name: outputFileName };
}

async function resize(
  imageBuffer: Buffer,
  width: number
): Promise<{ file: string; info: any }> {
  const stream = new sharp(imageBuffer);

  const minifiedBuffer = await stream.resize(width).toBuffer();

  const info = await stream.metadata();

  return {
    file: minifiedBuffer.toString('base64'),
    info
  };
}
