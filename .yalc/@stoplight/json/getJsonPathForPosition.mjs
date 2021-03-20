import * as jsonc from 'jsonc-parser';

const getJsonPathForPosition = ({ lineMap, ast }, position) => {
    const startOffset = lineMap[position.line];
    const endOffset = lineMap[position.line + 1];
    if (startOffset === void 0) {
        return;
    }
    const node = jsonc.findNodeAtOffset(ast, endOffset === void 0 ? startOffset + position.character : Math.min(endOffset, startOffset + position.character), true);
    if (node === undefined) {
        return;
    }
    const path = jsonc.getNodePath(node);
    if (path.length === 0)
        return;
    return path;
};

export { getJsonPathForPosition };
