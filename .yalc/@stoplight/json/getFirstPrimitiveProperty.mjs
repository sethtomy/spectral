import { createScanner } from 'jsonc-parser';

const getFirstPrimitiveProperty = (text) => {
    const scanner = createScanner(text, true);
    scanner.scan();
    if (scanner.getToken() !== 1) {
        return;
    }
    scanner.scan();
    if (scanner.getToken() === 2) {
        return;
    }
    if (scanner.getToken() !== 10) {
        throw new SyntaxError('Unexpected character');
    }
    const property = scanner.getTokenValue();
    scanner.scan();
    if (scanner.getToken() !== 6) {
        throw new SyntaxError('Colon expected');
    }
    scanner.scan();
    switch (scanner.getToken()) {
        case 10:
            return [property, scanner.getTokenValue()];
        case 11:
            return [property, Number(scanner.getTokenValue())];
        case 8:
            return [property, true];
        case 9:
            return [property, false];
        case 7:
            return [property, null];
        case 16:
            throw new SyntaxError('Unexpected character');
        case 17:
            throw new SyntaxError('Unexpected end of file');
        default:
            return;
    }
};

export { getFirstPrimitiveProperty };
