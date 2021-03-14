import { replaceInString } from './_utils.mjs';

const encodePointerFragment = (value) => {
    return typeof value === 'number' ? value : replaceInString(replaceInString(value, '~', '~0'), '/', '~1');
};

export { encodePointerFragment };
