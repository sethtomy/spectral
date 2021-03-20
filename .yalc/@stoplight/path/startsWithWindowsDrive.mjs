import { parse } from './parse.mjs';

const startsWithWindowsDrive = (str) => {
    const parsed = parse(str);
    return parsed.drive !== null;
};

export { startsWithWindowsDrive };
