import { safeStringify } from './safeStringify.mjs';

const stringify = (value, replacer, space) => {
    const stringified = safeStringify(value, replacer, space);
    if (stringified === void 0) {
        throw new Error('The value could not be stringified');
    }
    return stringified;
};

export { stringify };
