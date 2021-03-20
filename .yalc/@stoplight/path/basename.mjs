import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';
import { parseBase } from './parseBase.mjs';

const basename = (path, removeExtension) => {
    const parsed = normalizeParsed(parse(path));
    const base = parsed.path.pop();
    if (!base)
        return '';
    const { name, ext } = parseBase(base);
    return removeExtension === true || removeExtension === ext ? name : `${name}${ext}`;
};

export { basename };
