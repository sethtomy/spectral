import { Dictionary } from '@stoplight/types';
import { DiagnosticSeverity } from '@stoplight/types';
import { IHttpAndFileResolverOptions } from '../resolvers/http-and-file';
import { HumanReadableDiagnosticSeverity, IRuleDefinition } from './rule/types';
import { FormatLookup } from '../types/spectral';
import { CustomFunction } from './customFunction/customFunction';
export declare type FileRuleSeverity = DiagnosticSeverity | HumanReadableDiagnosticSeverity | boolean;
export declare type FileRulesetSeverity = 'off' | 'recommended' | 'all';
export declare type FileRule = IRuleDefinition | FileRuleSeverity | [FileRuleSeverity] | [FileRuleSeverity, object];
export declare type FileRuleCollection = Dictionary<FileRule, string>;
export declare type RulesetFunctionCollection = Dictionary<CustomFunction, string>;
export declare type RulesetExceptionCollection = Dictionary<string[], string>;
export interface IParserOptions {
    duplicateKeys?: DiagnosticSeverity | HumanReadableDiagnosticSeverity;
    incompatibleValues?: DiagnosticSeverity | HumanReadableDiagnosticSeverity;
}
export declare type RulesetDefinition = {
    documentationUrl?: string;
    formats?: FormatLookup[];
    except?: RulesetExceptionCollection;
    parserOptions?: IParserOptions;
} & ({
    extends: Array<RulesetDefinition | [RulesetDefinition, FileRulesetSeverity]>;
} | {
    rules: FileRuleCollection;
} | {
    extends: Array<RulesetDefinition | [RulesetDefinition, FileRulesetSeverity]>;
    rules: FileRuleCollection;
});
export interface IRulesetReadOptions extends IHttpAndFileResolverOptions {
    timeout?: number;
}
