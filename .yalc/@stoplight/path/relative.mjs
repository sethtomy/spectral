import { format } from './format.mjs';
import { normalizeParsed } from './normalize.mjs';
import { parse } from './parse.mjs';

function relative(fromDir, to) {
    const toParsed = normalizeParsed(parse(to));
    if (!toParsed.absolute) {
        return format(toParsed);
    }
    const fromParsed = normalizeParsed(parse(fromDir));
    if (toParsed.origin !== fromParsed.origin)
        return format(toParsed);
    if (!fromParsed.absolute)
        return format(toParsed);
    if (fromParsed.drive !== toParsed.drive)
        return format(toParsed);
    const maxIter = Math.min(fromParsed.path.length, toParsed.path.length);
    for (let _ = 0; _ < maxIter; _++) {
        if (fromParsed.path[0] === toParsed.path[0]) {
            fromParsed.path.shift();
            toParsed.path.shift();
        }
        else {
            break;
        }
    }
    toParsed.path.unshift(...fromParsed.path.fill('..'));
    const newPath = {
        origin: null,
        drive: null,
        absolute: false,
        protocol: null,
        path: toParsed.path,
    };
    return format(newPath);
}

export { relative };
