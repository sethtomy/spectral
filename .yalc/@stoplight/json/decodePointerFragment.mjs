import { replaceInString } from './_utils.mjs';

const decodePointerFragment = (value) => {
    return replaceInString(replaceInString(value, '~1', '/'), '~0', '~');
};

export { decodePointerFragment };
