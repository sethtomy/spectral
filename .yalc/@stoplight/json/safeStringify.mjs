import fastStringify from 'safe-stable-stringify';

const safeStringify = (value, replacer, space) => {
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value, replacer, space);
    }
    catch (_a) {
        return fastStringify(value, replacer, space);
    }
};

export { safeStringify };
