import { Optional } from '@stoplight/types';
import { Ruleset } from '../../../../ruleset/ruleset';
import * as fs from 'fs';
import * as path from '@stoplight/path';
import { isDefaultRulesetFile } from '../../../../ruleset/utils';

async function getDefaultRulesetFile(): Promise<Optional<string>> {
  const cwd = process.cwd();
  for (const filename of await fs.promises.readdir(cwd)) {
    if (isDefaultRulesetFile(filename)) {
      return path.join(cwd, filename);
    }
  }

  return;
}

export async function getRuleset(rulesetFile: Optional<string>): Promise<Ruleset> {
  if (rulesetFile === void 0) {
    rulesetFile = await getDefaultRulesetFile();
  }

  if (rulesetFile === void 0) {
    throw new Error('No ruleset specified');
  }

  return new Ruleset(require(rulesetFile), { severity: 'recommended' });
}
