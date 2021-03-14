import { DiagnosticSeverity } from '@stoplight/types';
import { FormatLookup, IFunction } from '../../types';

export interface IRuleDefinition {
  type?: 'validation' | 'style';

  formats?: FormatLookup[];

  documentationUrl?: string;

  // A meaningful feedback about the error
  message?: string;

  // A long-form description of the rule formatted in markdown
  description?: string;

  // The severity of results this rule generates
  severity?: DiagnosticSeverity | HumanReadableDiagnosticSeverity;

  // some rules are more important than others, recommended rules will be enabled by default
  // true by default
  recommended?: boolean;

  // Filter the target down to a subset[] with a JSON path
  given: string | string[];

  // If false, rule will operate on original (unresolved) data
  // If undefined or true, resolved data will be supplied
  resolved?: boolean;

  then: IRuleThen | IRuleThen[];
}

export interface IRuleThen {
  // the `path.to.prop` to field, or special `@key` value to target keys for matched `given` object
  // EXAMPLE: if the target object is an oas object and given = `$..responses[*]`, then `@key` would be the response code (200, 400, etc)
  field?: string;

  // name of the function to run
  function: IFunction;

  // Options passed to the function
  functionOptions?: unknown;
}

export type HumanReadableDiagnosticSeverity = 'error' | 'warn' | 'info' | 'hint' | 'off';
