import { trimStart as trimStart$1 } from 'lodash-es';

function trimStart(target, elems) {
    if (typeof target === 'string' && typeof elems === 'string') {
        return trimStart$1(target, elems);
    }
    if (!target || !Array.isArray(target) || !target.length || !elems || !Array.isArray(elems) || !elems.length)
        return target;
    let toRemove = 0;
    for (const i in target) {
        if (!target.hasOwnProperty(i))
            continue;
        if (target[i] !== elems[i])
            break;
        toRemove++;
    }
    return target.slice(toRemove);
}

export { trimStart };
