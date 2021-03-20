import { parse } from './parse.mjs';
import { sep } from './sep.mjs';

const stripRoot = (path) => parse(path)
    .path.filter(Boolean)
    .join(sep);

export { stripRoot };
