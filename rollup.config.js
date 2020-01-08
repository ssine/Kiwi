// rollup.config.js
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/ui/ts/main.ts',
  output: {
    dir: 'build/ui/js/',
    format: 'cjs'
  },
  plugins: [typescript({lib: ["es5", "es6", "dom"], target: "es5"})]
};
