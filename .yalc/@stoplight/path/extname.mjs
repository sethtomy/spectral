import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';
import { parseBase } from './parseBase.mjs';

const extname = (path) => {
    const parsed = normalizeParsed(parse(path));
    const base = parsed.path.pop();
    if (!base)
        return '';
    const { ext } = parseBase(base);
    return ext;
};

export { extname };
