import { encodePointerFragment } from './encodePointerFragment.mjs';

const pathToPointer = (path) => {
    return encodeUriFragmentIdentifier(path);
};
const encodeUriFragmentIdentifier = (path) => {
    if (path && typeof path !== 'object') {
        throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
        return '#';
    }
    return `#/${path.map(encodePointerFragment).join('/')}`;
};

export { pathToPointer };
