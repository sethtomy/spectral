import { Dictionary } from '@stoplight/types';
import { DiagnosticSeverity } from '@stoplight/types';
import { IHttpAndFileResolverOptions } from '../resolvers/http-and-file';
import { HumanReadableDiagnosticSeverity, IRuleDefinition } from './rule/types';
import { FormatLookup } from '../types/spectral';

export type FileRuleSeverity = DiagnosticSeverity | HumanReadableDiagnosticSeverity | boolean;
export type FileRulesetSeverity = 'off' | 'recommended' | 'all';

export type FileRule = IRuleDefinition | FileRuleSeverity;

export type FileRuleCollection = Dictionary<FileRule, string>;

export type RulesetExceptionCollection = Dictionary<string[], string>;

export interface IParserOptions {
  duplicateKeys?: DiagnosticSeverity | HumanReadableDiagnosticSeverity;
  incompatibleValues?: DiagnosticSeverity | HumanReadableDiagnosticSeverity;
}

export type RulesetDefinition = {
  documentationUrl?: string;
  formats?: FormatLookup[];
  except?: RulesetExceptionCollection;
  parserOptions?: IParserOptions;
} & (
  | {
      extends: Array<RulesetDefinition | [RulesetDefinition, FileRulesetSeverity]>;
    }
  | {
      rules: FileRuleCollection;
    }
  | {
      extends: Array<RulesetDefinition | [RulesetDefinition, FileRulesetSeverity]>;
      rules: FileRuleCollection;
    }
);

export interface IRulesetReadOptions extends IHttpAndFileResolverOptions {
  timeout?: number;
}
