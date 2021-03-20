import { Kind } from '@stoplight/yaml-ast-parser';
import { isObject } from './utils.mjs';

function buildJsonPath(node) {
    const path = [];
    let prevNode = node;
    while (node) {
        switch (node.kind) {
            case Kind.SCALAR:
                path.unshift(node.value);
                break;
            case Kind.MAPPING:
                if (prevNode !== node.key) {
                    if (path.length > 0 && isObject(node.value) && node.value.value === path[0]) {
                        path[0] = node.key.value;
                    }
                    else {
                        path.unshift(node.key.value);
                    }
                }
                break;
            case Kind.SEQ:
                if (prevNode) {
                    const index = node.items.indexOf(prevNode);
                    if (prevNode.kind === Kind.SCALAR) {
                        path[0] = index;
                    }
                    else if (index !== -1) {
                        path.unshift(index);
                    }
                }
                break;
        }
        prevNode = node;
        node = node.parent;
    }
    return path;
}

export { buildJsonPath };
