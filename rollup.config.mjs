import typescript from 'rollup-plugin-typescript2';
import * as path from 'path';
import json from '@rollup/plugin-json';
import { basename, dirname } from '@stoplight/path';
import shebang from 'rollup-plugin-preserve-shebang';

const BASE_PATH = process.cwd();

const inputs = ['src/index.ts', 'src/cli/index.ts', 'src/rulesets/oas/index.ts'];

const input = inputs.reduce((a, input) => {
  a[`${dirname(input)}/${basename(input, true)}`.replace('src/', '')] = input;
  return a;
}, {});

// needs https://github.com/trygve-lie/rollup-plugin-esm-import-to-url
export default {
  input,
  plugins: [
    shebang(),
    typescript({
      check: false,
      clean: false,
      tsconfig: path.join(BASE_PATH, './tsconfig.rollup.json'),
    }),
    json(),
    // terser(),
  ],
  output: {
    dir: 'dist',
    entryFileNames: `[name].mjs`,
    preserveModules: true, // or `false` to bundle as a single file
    preserveModulesRoot: 'src',
    format: 'esm',
  },
};
