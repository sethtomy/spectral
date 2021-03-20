import { Kind } from '@stoplight/yaml-ast-parser';
import { isObject } from './utils.mjs';

const dereferenceAnchor = (node, anchorId) => {
    if (!isObject(node))
        return node;
    if (node.kind === Kind.ANCHOR_REF && node.referencesAnchor === anchorId)
        return null;
    switch (node.kind) {
        case Kind.MAP:
            return Object.assign({}, node, { mappings: node.mappings.map(mapping => dereferenceAnchor(mapping, anchorId)) });
        case Kind.SEQ:
            return Object.assign({}, node, { items: node.items.map(item => dereferenceAnchor(item, anchorId)) });
        case Kind.MAPPING:
            return Object.assign({}, node, { value: dereferenceAnchor(node.value, anchorId) });
        case Kind.SCALAR:
            return node;
        case Kind.ANCHOR_REF:
            if (isObject(node.value) && isSelfReferencingAnchorRef(node)) {
                return null;
            }
            return node;
        default:
            return node;
    }
};
const isSelfReferencingAnchorRef = (anchorRef) => {
    const { referencesAnchor } = anchorRef;
    let node = anchorRef;
    while ((node = node.parent)) {
        if ('anchorId' in node && node.anchorId === referencesAnchor) {
            return true;
        }
    }
    return false;
};

export { dereferenceAnchor };
