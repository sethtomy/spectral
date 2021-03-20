import { parse as grammar_1 } from './grammar.mjs';

function parse(path) {
    if (typeof path !== 'string')
        throw new Error(`@stoplight/path: Cannot parse ${path} because it is not a string`);
    return grammar_1(path, {});
}

export { parse };
