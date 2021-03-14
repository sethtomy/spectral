import { replaceInString } from './_utils.mjs';

const decodePointer = (value) => {
    return replaceInString(replaceInString(decodeURIComponent('' + value), '~1', '/'), '~0', '~');
};

export { decodePointer };
