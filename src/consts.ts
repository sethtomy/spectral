import { DiagnosticSeverity } from '@stoplight/types';
import { IParserOptions } from './ruleset/types';

export const SPECTRAL_PKG_VERSION = '';

export const DEFAULT_PARSER_OPTIONS = Object.freeze<Required<IParserOptions>>({
  incompatibleValues: DiagnosticSeverity.Error,
  duplicateKeys: DiagnosticSeverity.Error,
});
