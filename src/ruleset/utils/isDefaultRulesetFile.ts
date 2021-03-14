const DEFAULT_RULESET_FILE = /^\.?spectral\.m?js$/;

export const isDefaultRulesetFile = (uri: string): boolean => DEFAULT_RULESET_FILE.test(uri);

