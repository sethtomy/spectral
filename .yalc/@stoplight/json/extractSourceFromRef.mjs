import { isLocalRef } from './isLocalRef.mjs';

const extractSourceFromRef = (ref) => {
    if (typeof ref !== 'string' || ref.length === 0 || isLocalRef(ref)) {
        return null;
    }
    const index = ref.indexOf('#');
    return index === -1 ? ref : ref.slice(0, index);
};

export { extractSourceFromRef };
