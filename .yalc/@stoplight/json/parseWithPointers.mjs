import createOrderedObject, { getOrder } from '@stoplight/ordered-object-literal';
import { DiagnosticSeverity } from '@stoplight/types';
import * as jsonc from 'jsonc-parser';

const { printParseErrorCode, visit } = jsonc;
const parseWithPointers = (value, options = { disallowComments: true }) => {
    const diagnostics = [];
    const { ast, data, lineMap } = parseTree(value, diagnostics, options);
    return {
        data,
        diagnostics,
        ast,
        lineMap,
    };
};
function parseTree(text, errors = [], options) {
    const lineMap = computeLineMap(text);
    let currentParent = { type: 'array', offset: -1, length: -1, children: [], parent: void 0 };
    let currentParsedProperty = null;
    let currentParsedParent = [];
    const objectKeys = new WeakMap();
    const previousParsedParents = [];
    function ensurePropertyComplete(endOffset) {
        if (currentParent.type === 'property') {
            currentParent.length = endOffset - currentParent.offset;
            currentParent = currentParent.parent;
        }
    }
    function calculateRange(startLine, startCharacter, length) {
        return {
            start: {
                line: startLine,
                character: startCharacter,
            },
            end: {
                line: startLine,
                character: startCharacter + length,
            },
        };
    }
    function onValue(valueNode) {
        currentParent.children.push(valueNode);
        return valueNode;
    }
    function onParsedValue(value) {
        if (Array.isArray(currentParsedParent)) {
            currentParsedParent.push(value);
        }
        else if (currentParsedProperty !== null) {
            currentParsedParent[currentParsedProperty] = value;
        }
    }
    function onParsedComplexBegin(value) {
        onParsedValue(value);
        previousParsedParents.push(currentParsedParent);
        currentParsedParent = value;
        currentParsedProperty = null;
    }
    function onParsedComplexEnd() {
        currentParsedParent = previousParsedParents.pop();
    }
    const visitor = {
        onObjectBegin: (offset, length, startLine, startCharacter) => {
            currentParent = onValue({
                type: 'object',
                offset,
                length: -1,
                parent: currentParent,
                children: [],
                range: calculateRange(startLine, startCharacter, length),
            });
            if (options.ignoreDuplicateKeys === false) {
                objectKeys.set(currentParent, []);
            }
            onParsedComplexBegin(createObjectLiteral(options.preserveKeyOrder === true));
        },
        onObjectProperty: (name, offset, length, startLine, startCharacter) => {
            currentParent = onValue({ type: 'property', offset, length: -1, parent: currentParent, children: [] });
            currentParent.children.push({ type: 'string', value: name, offset, length, parent: currentParent });
            if (options.ignoreDuplicateKeys === false) {
                const currentObjectKeys = objectKeys.get(currentParent.parent);
                if (currentObjectKeys) {
                    if (currentObjectKeys.length === 0 || !currentObjectKeys.includes(name)) {
                        currentObjectKeys.push(name);
                    }
                    else {
                        errors.push({
                            range: calculateRange(startLine, startCharacter, length),
                            message: 'DuplicateKey',
                            severity: DiagnosticSeverity.Error,
                            path: getJsonPath(currentParent),
                            code: 20,
                        });
                    }
                }
            }
            if (options.preserveKeyOrder === true) {
                swapKey(currentParsedParent, name);
            }
            currentParsedProperty = name;
        },
        onObjectEnd: (offset, length, startLine, startCharacter) => {
            if (options.ignoreDuplicateKeys === false) {
                objectKeys.delete(currentParent);
            }
            currentParent.length = offset + length - currentParent.offset;
            if (currentParent.range) {
                currentParent.range.end.line = startLine;
                currentParent.range.end.character = startCharacter + length;
            }
            currentParent = currentParent.parent;
            ensurePropertyComplete(offset + length);
            onParsedComplexEnd();
        },
        onArrayBegin: (offset, length, startLine, startCharacter) => {
            currentParent = onValue({
                type: 'array',
                offset,
                length: -1,
                parent: currentParent,
                children: [],
                range: calculateRange(startLine, startCharacter, length),
            });
            onParsedComplexBegin([]);
        },
        onArrayEnd: (offset, length, startLine, startCharacter) => {
            currentParent.length = offset + length - currentParent.offset;
            if (currentParent.range) {
                currentParent.range.end.line = startLine;
                currentParent.range.end.character = startCharacter + length;
            }
            currentParent = currentParent.parent;
            ensurePropertyComplete(offset + length);
            onParsedComplexEnd();
        },
        onLiteralValue: (value, offset, length, startLine, startCharacter) => {
            onValue({
                type: getLiteralNodeType(value),
                offset,
                length,
                parent: currentParent,
                value,
                range: calculateRange(startLine, startCharacter, length),
            });
            ensurePropertyComplete(offset + length);
            onParsedValue(value);
        },
        onSeparator: (sep, offset, length) => {
            if (currentParent.type === 'property') {
                if (sep === ':') {
                    currentParent.colonOffset = offset;
                }
                else if (sep === ',') {
                    ensurePropertyComplete(offset);
                }
            }
        },
        onError: (error, offset, length, startLine, startCharacter) => {
            errors.push({
                range: calculateRange(startLine, startCharacter, length),
                message: printParseErrorCode(error),
                severity: DiagnosticSeverity.Error,
                code: error,
            });
        },
    };
    visit(text, visitor, options);
    const result = currentParent.children[0];
    if (result) {
        delete result.parent;
    }
    return {
        ast: result,
        data: currentParsedParent[0],
        lineMap,
    };
}
function getLiteralNodeType(value) {
    switch (typeof value) {
        case 'boolean':
            return 'boolean';
        case 'number':
            return 'number';
        case 'string':
            return 'string';
        default:
            return 'null';
    }
}
const computeLineMap = (input) => {
    const lineMap = [0];
    let i = 0;
    for (; i < input.length; i++) {
        if (input[i] === '\n') {
            lineMap.push(i + 1);
        }
    }
    lineMap.push(i + 1);
    return lineMap;
};
function getJsonPath(node, path = []) {
    if (node.type === 'property') {
        path.unshift(node.children[0].value);
    }
    if (node.parent !== void 0) {
        if (node.parent.type === 'array' && node.parent.parent !== void 0) {
            path.unshift(node.parent.children.indexOf(node));
        }
        return getJsonPath(node.parent, path);
    }
    return path;
}
function createObjectLiteral(preserveKeyOrder) {
    return preserveKeyOrder ? createOrderedObject({}) : {};
}
function swapKey(container, key) {
    if (!(key in container))
        return;
    const order = getOrder(container);
    const index = order.indexOf(key);
    if (index !== -1) {
        order.splice(index, 1);
        order.push(key);
    }
}

export { parseTree, parseWithPointers };
