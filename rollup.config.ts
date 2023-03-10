import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import clear from 'rollup-plugin-clear'
import json from '@rollup/plugin-json'
import copy from 'rollup-plugin-copy'

export default defineConfig({
  input: 'lib/cli.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    chunkFileNames: '[name].js'
  },

  plugins: [
    json(),
    nodeResolve(),
    commonjs(),
    clear({ targets: ['dist'] }),
    copy({
      targets: [
        { src: 'lib/cfg.json', dest: 'dist' }
      ]
    }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ]
})