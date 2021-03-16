import { isAbsolute, resolve } from '@stoplight/path';
import { Optional } from '@stoplight/types';

async function loadRulesets(cwd: string, rulesetFiles: string[]): Promise<IRuleset> {
  if (rulesetFiles.length === 0) {
    return {
      functions: {},
      rules: {},
      exceptions: {},
    };
  }

  return readRuleset(rulesetFiles.map(file => (isAbsolute(file) ? file : resolve(cwd, file))));
}

export async function getRuleset(rulesetFile: Optional<string>): Promise<IRuleset> {
  const rulesetFiles = rulesetFile ?? (await getDefaultRulesetFile(process.cwd()));

  return await (rulesetFiles !== null
    ? loadRulesets(process.cwd(), Array.isArray(rulesetFiles) ? rulesetFiles : [rulesetFiles])
    : readRuleset(KNOWN_RULESETS));
}
