import { DiagnosticSeverity } from '@stoplight/types';
import { IParserOptions } from './ruleset/types';

export const NPM_PKG_ROOT = 'https://unpkg.com/';
export const SPECTRAL_PKG_NAME = '@stoplight/spectral';
export const SPECTRAL_PKG_VERSION = '';

export const DEFAULT_PARSER_OPTIONS = Object.freeze<Required<IParserOptions>>({
  incompatibleValues: DiagnosticSeverity.Error,
  duplicateKeys: DiagnosticSeverity.Error,
});
