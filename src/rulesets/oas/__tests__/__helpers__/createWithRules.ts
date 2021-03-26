import { IConstructorOpts, Spectral } from '../../../../spectral';
import ruleset from '../../index';
import { Ruleset } from '../../../../ruleset/ruleset';

export async function createWithRules(
  // @ts-ignore
  rules: (keyof typeof ruleset['rules'])[],
  opts?: IConstructorOpts,
): Promise<Spectral> {
  const s = new Spectral(opts);
  s.setRuleset(
    new Ruleset(
      {
        extends: [ruleset],
        rules: rules.reduce((obj, name) => {
          obj[name] = true;
          return obj;
        }, {}),
      },
      {
        severity: 'off',
      },
    ),
  );

  // for (const rule of Object.values(s.ruleset!.rules)) {
  // let's make sure the rule is actually enabled
  // expect(rule.enabled).toBe(rule.name in rules);
  // }

  return s;
}
