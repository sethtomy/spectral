import { format } from './format.mjs';
import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';

const dirname = (path) => {
    const parsed = normalizeParsed(parse(path));
    parsed.path.pop();
    return format(normalizeParsed(parsed));
};

export { dirname };
