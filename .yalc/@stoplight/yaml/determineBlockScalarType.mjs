import { findNodeAtPath } from './findNodeAtPath.mjs';
import { Kind } from '@stoplight/yaml-ast-parser';

const LITERAL_BLOCK_STYLE_SIGN = '|';
const FOLDED_BLOCK_STYLE_SIGN = '>';
const STRIP_CHOMPING_SIGN = '-';
const KEEP_CHOMPING_SIGN = '+';
const C_CHOMPING_INDICATOR = /[-+]?/;
const C_INDENTATION_INDICATOR = /[1-9]?/;
const S_WHITE = /^[\u0020\u0009]$/;
const B_CHAR = /^[\u000A\u000D]$/;
const determineBlockScalarType = ({ ast, metadata }, path) => {
    const node = findNodeAtPath(ast, path, {
        closest: false,
        mergeKeys: metadata !== void 0 && metadata.mergeKeys === true,
    });
    if (node === void 0 || node.kind !== Kind.SCALAR || typeof node.value !== 'string')
        return;
    const { rawValue } = node;
    if (rawValue.length === 0)
        return;
    const style = rawValue[0] === FOLDED_BLOCK_STYLE_SIGN ? 'folded' : rawValue[0] === LITERAL_BLOCK_STYLE_SIGN ? 'literal' : void 0;
    if (style === void 0) {
        return;
    }
    return Object.assign({ style }, getBlockHeader(rawValue));
};
const C_B_BLOCK_HEADER = new RegExp([
    `^(?:(?<indentation>${C_INDENTATION_INDICATOR.source})(?<chomping>${C_CHOMPING_INDICATOR.source}))$`,
    `^(?:(?<chomping2>${C_CHOMPING_INDICATOR.source})(?<indentation2>${C_INDENTATION_INDICATOR.source}))$`,
].join('|'));
function getBlockHeader(value) {
    let n = -1;
    const max = Math.min(value.length, 3);
    while (n++ < max) {
        if (B_CHAR.test(value[n]) || S_WHITE.test(value[n])) {
            break;
        }
    }
    const result = C_B_BLOCK_HEADER.exec(value.slice(1, n));
    if (result === null) {
        return {
            indentation: null,
            chomping: 'clip',
        };
    }
    const groups = result.groups;
    const indentation = (groups.indentation || groups.indentation2 || null);
    const chomping = groups.chomping || groups.chomping2;
    return {
        indentation,
        chomping: chomping === STRIP_CHOMPING_SIGN ? 'strip' : chomping === KEEP_CHOMPING_SIGN ? 'keep' : 'clip',
    };
}

export { determineBlockScalarType };
