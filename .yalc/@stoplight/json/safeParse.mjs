const safeParse = (text, reviver) => {
    if (typeof text !== 'string')
        return text;
    try {
        const num = parseNumber(text);
        if (typeof num === 'string')
            return num;
        return JSON.parse(text, reviver);
    }
    catch (e) {
        return void 0;
    }
};
const parseNumber = (string) => {
    const numVal = Number(string);
    if (Number.isFinite(numVal)) {
        if (String(numVal) === string) {
            return numVal;
        }
        return string;
    }
    return NaN;
};

export { safeParse };
