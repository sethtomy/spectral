import { replaceInString } from './_utils.mjs';

const encodePointer = (value) => {
    return replaceInString(replaceInString(value, '~', '~0'), '//', '/~1');
};

export { encodePointer };
