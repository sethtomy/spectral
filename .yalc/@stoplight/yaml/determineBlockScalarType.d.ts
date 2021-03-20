import { Optional } from '@stoplight/types';
export declare type BlockScalarStyle = 'folded' | 'literal';
export declare type BlockChomping = 'strip' | 'keep' | 'clip';
export declare type BlockScalarType = {
    style: BlockScalarStyle;
    chomping: BlockChomping;
    indentation: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | null;
};
export declare const determineBlockScalarType: ({ ast, metadata }: import("@stoplight/types").IParserResult<unknown, import("./types").YAMLNode, number[], import("./types").IParseOptions>, path: import("@stoplight/types").Segment[]) => Optional<BlockScalarType>;
