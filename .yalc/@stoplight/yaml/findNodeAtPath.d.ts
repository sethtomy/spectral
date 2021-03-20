import { JsonPath, Optional } from '@stoplight/types';
import { YAMLNode } from './types';
export declare function findNodeAtPath(node: YAMLNode, path: JsonPath, { closest, mergeKeys }: {
    closest: boolean;
    mergeKeys: boolean;
}): Optional<YAMLNode>;
