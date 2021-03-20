import { extractSourceFromRef } from './extractSourceFromRef.mjs';
import { pointerToPath } from './pointerToPath.mjs';

function isObject(maybeObj) {
    return typeof maybeObj === 'object' && maybeObj !== null;
}
function _resolveInlineRef(document, ref, seen) {
    const source = extractSourceFromRef(ref);
    if (source !== null) {
        throw new ReferenceError('Cannot resolve external references');
    }
    const path = pointerToPath(ref);
    let value = document;
    for (const segment of path) {
        if (!isObject(value) || !(segment in value)) {
            throw new ReferenceError(`Could not resolve '${ref}'`);
        }
        value = value[segment];
        if (isObject(value) && '$ref' in value) {
            if (seen.includes(value)) {
                return seen[seen.length - 1];
            }
            seen.push(value);
            if (typeof value.$ref !== 'string') {
                throw new TypeError('$ref should be a string');
            }
            value = _resolveInlineRef(document, value.$ref, seen);
        }
    }
    return value;
}
function resolveInlineRef(document, ref) {
    return _resolveInlineRef(document, ref, []);
}

export { resolveInlineRef };
