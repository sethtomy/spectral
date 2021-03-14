import typescript from 'rollup-plugin-typescript2';
import * as path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { basename, dirname, join } from '@stoplight/path';
import { terser } from 'rollup-plugin-terser';

const BASE_PATH = process.cwd();

const inputs = ['src/rulesets/oas/index.ts'];

// needs https://github.com/trygve-lie/rollup-plugin-esm-import-to-url
module.exports = inputs.map(input => ({
  input,
  plugins: [
    typescript({
      check: false,
      tsconfig: path.join(BASE_PATH, './tsconfig.rollup.json'),
    }),
    json(),
    // terser(),
  ],
  output: {
    file: join(dirname(input), 'dist', `${basename(input, true)}.mjs`),
    format: 'esm',
  },
}));
