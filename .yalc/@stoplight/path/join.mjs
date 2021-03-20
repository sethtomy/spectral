import { format } from './format.mjs';
import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';

const join = (...parts) => {
    if (parts.length === 0)
        return '.';
    const parsedParts = parts.map(parse);
    const newRoot = Object.assign({}, parsedParts[0]);
    for (let i = 1; i < parsedParts.length; i++) {
        const parsed = parsedParts[i];
        if (parsed.absolute) {
            throw new Error('Cannot join an absolute path "' + parts[i] + '" in the middle of other paths.');
        }
        for (const segment of parsed.path) {
            newRoot.path.push(segment);
        }
    }
    return format(normalizeParsed(newRoot));
};

export { join };
