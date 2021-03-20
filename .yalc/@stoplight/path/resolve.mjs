import { format } from './format.mjs';
import { join } from './join.mjs';
import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';

function resolve(...pathSegments) {
    if (pathSegments.length === 0)
        return '.';
    const toPath = pathSegments[pathSegments.length - 1];
    const toParsed = normalizeParsed(parse(toPath));
    if (toParsed.absolute)
        return format(toParsed);
    return join(...pathSegments);
}

export { resolve };
