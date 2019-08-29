import fs from 'fs';
import { createFilter } from 'rollup-pluginutils';
import { lookup } from 'mime-types';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import mkpath from 'mkpath';
const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'];

export default function rollupSharp(options = {}) {
  const { include = defaultInclude, exclude, publicPath = '', minifiedWidth = 20 } = options;

  const filter = createFilter(include, exclude);
  const copies = {};

  return {
    load: async function(id) {
      if (!filter(id)) {
        return null;
      }

      const mimeType = lookup(id);
      const imageBuffer = fs.readFileSync(id);

      const [ { file, info }, url ] = await Promise.all([
        resize(imageBuffer, minifiedWidth),
        createImageUrl(id, imageBuffer, publicPath)
      ]);

      copies[id] = url;

      return `
        export default {
            base64: 'data:${mimeType};base64,${file}',
            url: '${url}',
            width: ${info.width},
            height: ${info.height}
        }`;
    },

    generateBundle: async function write(outputOptions) {
      const base = options.destDir || outputOptions.dir || path.dirname(outputOptions.file)

      await makePath(base)

      return Promise.all(Object.keys(copies).map(async name => {
        const output = copies[name]
        const outputDirectory = path.join(base, path.dirname(output))
        await makePath(outputDirectory);
        const imageBuffer = fs.readFileSync(name);
        return copy(imageBuffer, path.join(base, output))
      }))
    }
  };
}


/**
 * 
 * @param {string} image
 * @param {Buffer} imageBuffer 
 * @param {string} publicPath 
 */
async function createImageUrl(image, imageBuffer, publicPath) {
  const hash = crypto.createHash("sha1")
    .update(imageBuffer)
    .digest("hex")
    .substr(0, 16);
    
  const ext = path.extname(image);
  const name = path.basename(image, ext);
  const fileName = `${name}.${hash}${ext}`;
  return `${publicPath}${fileName}`;
}

/**
 * 
 * Resize the given image
 * 
 * @param {Buffer} imageBuffer - base64
 * @returns {Object} resized file - base64
 */
async function resize(imageBuffer, width) {
  const stream = sharp(imageBuffer);

  const minifiedBuffer = await stream
    .resize(width)
    .toBuffer();

  const info = await stream
    .metadata();

  return {
    file: minifiedBuffer.toString('base64'),
    info
  }
}

function copy(imageBuffer, dest) {
  return new Promise((resolve, reject) => {
    fs.writeFile(dest, imageBuffer, (err) => err ? reject(err) : resolve());
  });
}

/**
 * run mkpath for given path
 * @param {string} path 
 */
async function makePath(path) {
  await new Promise((resolve, reject) => {
    mkpath(path, (err) => err ? reject(err) : resolve());
  });
}