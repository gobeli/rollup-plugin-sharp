import { createFilter } from 'rollup-pluginutils';

const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'];

export default function sharp(options = {}) {
  const { include = defaultInclude, exclude, publicPath = '' } = options;

  const filter = createFilter(include, exclude);
  return {
    load(id) {
      if (!filter(id)) {
        return null;
      }
    }
  };
}
