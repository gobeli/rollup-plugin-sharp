import { readFileSync, writeFile } from 'fs';
import { createFilter } from 'rollup-pluginutils';
import { lookup } from 'mime-types';
import { join, dirname, extname, basename } from 'path';
import { createHash } from 'crypto';
import sharp from 'sharp';
import mkpath from 'mkpath';
import { OutputOptions } from 'rollup';
const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'];

export interface SharpOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  publicPath?: string;
  destDir?: string;
  minifiedWidth?: number;
}

export default function rollupSharp(options: SharpOptions = {}) {
  const {
    include = defaultInclude,
    exclude,
    publicPath = '',
    minifiedWidth = 20
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
      const imageBuffer = readFileSync(id);

      const [{ file, info }, { url, name }] = await Promise.all([
        resize(imageBuffer, minifiedWidth),
        createImageUrl(id, imageBuffer, publicPath)
      ]);

      copies[id] = name;

      return `
        export default {
            base64: 'data:${mimeType};base64,${file}',
            url: '${url}',
            width: ${info.width},
            height: ${info.height}
        }`;
    },

    generateBundle: async function write(outputOptions: OutputOptions) {
      const base =
        options.destDir || outputOptions.dir || dirname(outputOptions.file);

      await makePath(base);

      return Promise.all(
        Object.keys(copies).map(async name => {
          const output = copies[name];
          const outputDirectory = join(base, dirname(output));
          await makePath(outputDirectory);
          const imageBuffer = readFileSync(name);
          return copy(imageBuffer, join(base, output));
        })
      );
    }
  };
}

async function createImageUrl(
  image: string,
  imageBuffer: Buffer,
  publicPath: string
): Promise<{ url: string; name: string }> {
  const hash = createHash('sha1')
    .update(imageBuffer)
    .digest('hex')
    .substr(0, 16);

  const ext = extname(image);
  const name = basename(image, ext);
  const fileName = `${name}.${hash}${ext}`;
  return { url: `${publicPath}${fileName}`, name: fileName };
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

function copy(imageBuffer: Buffer, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(dest, imageBuffer, err => (err ? reject(err) : resolve()));
  });
}

function makePath(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkpath(path, err => (err ? reject(err) : resolve()));
  });
}
