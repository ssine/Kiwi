// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'

export default {
  input: 'src/ui/ts/main.ts',
  output: {
    dir: 'build/ui/js/',
    format: 'cjs'
  },
  plugins: [
    resolve({ preferBuiltins: true, mainFields: ['browser'] }),
    typescript({lib: ["es5", "es6", "dom"], target: "esnext"}),
    commonJS({
      include: 'node_modules/**'
    })
  ]
};
