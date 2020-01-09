// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'

export default {
  input: 'src/ui/main.ts',
  output: {
    dir: 'build/kiwi/ui/js/',
    format: 'cjs'
  },
  plugins: [
    resolve({ preferBuiltins: true, browser: true, mainFields: ['browser'] }),
    typescript({lib: ["es5", "es6", "dom"], target: "esnext"}),
    commonJS({
      include: 'node_modules/**'
    })
  ]
};
