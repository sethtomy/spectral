import { decodePointer } from './decodePointer.mjs';

const pointerToPath = (pointer) => {
    return decodeUriFragmentIdentifier(pointer);
};
const decodeFragmentSegments = (segments) => {
    const len = segments.length;
    const res = [];
    let i = -1;
    while (++i < len) {
        res.push(decodePointer(segments[i]));
    }
    return res;
};
const decodeUriFragmentIdentifier = (ptr) => {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0 || ptr[0] !== '#') {
        throw new URIError('Invalid JSON Pointer syntax; URI fragment identifiers must begin with a hash.');
    }
    if (ptr.length === 1) {
        return [];
    }
    if (ptr[1] !== '/') {
        throw new URIError('Invalid JSON Pointer syntax.');
    }
    return decodeFragmentSegments(ptr.substring(2).split('/'));
};

export { pointerToPath };