import { format } from './format.mjs';
import { parse } from './parse.mjs';

function normalize(filepath) {
    return format(normalizeParsed(parse(filepath)));
}
function normalizeParsed(parsed) {
    let path = parsed.path;
    path = path.filter(segment => segment !== '' && segment !== '.');
    const stack = [];
    for (const segment of path) {
        if (segment === '..' && stack.length && stack[stack.length - 1] !== '..') {
            stack.pop();
        }
        else if (segment !== '..' || !parsed.absolute) {
            stack.push(segment);
        }
    }
    parsed.path = stack;
    return parsed;
}

export { normalize, normalizeParsed };
