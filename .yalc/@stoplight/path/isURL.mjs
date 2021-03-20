import { parse } from './parse.mjs';

function isURL(filepath) {
    const parsed = parse(filepath);
    return parsed.protocol === 'http' || parsed.protocol === 'https';
}

export { isURL };
