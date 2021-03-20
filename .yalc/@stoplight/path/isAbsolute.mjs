import { parse } from './parse.mjs';

function isAbsolute(filepath) {
    const parsed = parse(filepath);
    return parsed.absolute;
}

export { isAbsolute };
