import typescript from 'rollup-plugin-typescript';

const external = [
  'rollup-pluginutils',
  'path',
  'fs',
  'mime-types',
  'crypto',
  'sharp',
  'mkpath'
];

export default {
  input: 'src/index.ts',
  external,
  plugins: [typescript()],
  output: {
    format: 'cjs',
    file: 'dist/index.js'
  }
};
