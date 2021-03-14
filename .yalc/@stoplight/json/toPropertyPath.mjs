import { decodePointerFragment } from './decodePointerFragment.mjs';

function toPropertyPath(path) {
    return path
        .replace(/^(\/|#\/)/, '')
        .split('/')
        .map(decodePointerFragment)
        .map(sanitize)
        .join('.');
}
function sanitize(fragment) {
    if (fragment.includes('.')) {
        return `["${fragment.replace(/"/g, '\\"')}"]`;
    }
    else {
        return fragment;
    }
}

export { toPropertyPath };
