import { Optional } from '@stoplight/types';
import * as graph from 'dependency-graph';
import * as Types from './types';
export declare class ResolveCrawler implements Types.ICrawler {
    private _resolved;
    readonly resolvers: Array<Promise<Types.IUriResult>>;
    jsonPointer?: string;
    readonly pointerGraph: graph.DepGraph<string>;
    readonly pointerStemGraph: graph.DepGraph<string>;
    private _runner;
    constructor(runner: Types.IResolveRunner, jsonPointer: Optional<string>, _resolved: Types.IResolveResult);
    computeGraph: (target: any, parentPath?: string[], parentPointer?: string, pointerStack?: string[]) => void;
    private _resolveRef;
}
