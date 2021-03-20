import { Kind } from '@stoplight/yaml-ast-parser';
import { isObject } from './utils.mjs';

function findNodeAtPath(node, path, { closest, mergeKeys }) {
    pathLoop: for (const segment of path) {
        if (!isObject(node)) {
            return closest ? node : void 0;
        }
        switch (node.kind) {
            case Kind.MAP:
                const mappings = getMappings(node.mappings, mergeKeys);
                for (let i = mappings.length - 1; i >= 0; i--) {
                    const item = mappings[i];
                    if (item.key.value === segment) {
                        if (item.value === null) {
                            node = item.key;
                        }
                        else {
                            node = item.value;
                        }
                        continue pathLoop;
                    }
                }
                return closest ? node : void 0;
            case Kind.SEQ:
                for (let i = 0; i < node.items.length; i++) {
                    if (i === Number(segment)) {
                        const item = node.items[i];
                        if (item === null) {
                            break;
                        }
                        node = item;
                        continue pathLoop;
                    }
                }
                return closest ? node : void 0;
            default:
                return closest ? node : void 0;
        }
    }
    return node;
}
function getMappings(mappings, mergeKeys) {
    if (!mergeKeys)
        return mappings;
    return mappings.reduce((mergedMappings, mapping) => {
        if (isObject(mapping)) {
            if (mapping.key.value === "<<") {
                mergedMappings.push(...reduceMergeKeys(mapping.value));
            }
            else {
                mergedMappings.push(mapping);
            }
        }
        return mergedMappings;
    }, []);
}
function reduceMergeKeys(node) {
    if (!isObject(node))
        return [];
    switch (node.kind) {
        case Kind.SEQ:
            return node.items.reduceRight((items, item) => {
                items.push(...reduceMergeKeys(item));
                return items;
            }, []);
        case Kind.MAP:
            return node.mappings;
        case Kind.ANCHOR_REF:
            return reduceMergeKeys(node.value);
        default:
            return [];
    }
}

export { findNodeAtPath };
