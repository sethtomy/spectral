import type { HumanReadableDiagnosticSeverity } from '../ruleset/rule/types';

export type FailSeverity = HumanReadableDiagnosticSeverity;

export enum OutputFormat {
  JSON = 'json',
  STYLISH = 'stylish',
  JUNIT = 'junit',
  HTML = 'html',
  TEXT = 'text',
  TEAMCITY = 'teamcity',
}

export interface ILintConfig {
  encoding: string;
  format: OutputFormat;
  output?: string;
  resolver?: string;
  ruleset?: string[];
  skipRule?: string[];
  ignoreUnknownFormat: boolean;
  showUnmatchedGlobs: boolean;
  failOnUnmatchedGlobs: boolean;
  verbose?: boolean;
  quiet?: boolean;
}
