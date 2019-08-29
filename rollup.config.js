import babel from 'rollup-plugin-babel';

const external = ['rollup-pluginutils', 'path', 'fs'];

export default {
  input: 'src/index.js',
  external,
  plugins: [
    babel({
      babelrc: true
    })
  ],
  output: {
    format: 'cjs',
    file: 'dist/index.js'
  }
};
