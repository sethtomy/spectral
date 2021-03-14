import { decodePointerFragment } from './decodePointerFragment.mjs';

function getLastPathSegment(path) {
    return decodePointerFragment(path.split('/').pop() || '');
}

export { getLastPathSegment };
