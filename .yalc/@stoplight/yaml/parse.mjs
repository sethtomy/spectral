import { load } from '@stoplight/yaml-ast-parser';
import { walkAST } from './parseWithPointers.mjs';

const parse = (value) => walkAST(load(value), void 0, [], []);

export { parse };
