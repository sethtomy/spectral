import { assertValidRule, assertValidRuleset } from './validation';
import { Rule } from './rule/rule';
import { IParserOptions, RulesetDefinition, FileRulesetSeverity, RulesetExceptionCollection } from './types';
import { DEFAULT_PARSER_OPTIONS } from '../consts';
import { mergeRules } from './mergers/rules';
import { FormatLookup } from '../types';
// import { mergeExceptions } from './mergers/exceptions';

type RulesetContext = {
  severity: FileRulesetSeverity;
};

export class Ruleset {
  protected extends: Ruleset[];
  public formats = new Set<FormatLookup>();

  constructor(protected readonly definition: RulesetDefinition, protected readonly context: RulesetContext) {
    assertValidRuleset(definition);

    this.extends =
      'extends' in definition
        ? definition.extends.map(extension =>
            Array.isArray(extension)
              ? new Ruleset(extension[0], { severity: extension[1] })
              : new Ruleset(extension, { severity: 'recommended' }),
          )
        : [];
  }

  public get exceptions(): RulesetExceptionCollection | null {
    if (this.extends.length === 0 && this.definition.except === void 0) {
      return null;
    }

    const exceptions: RulesetExceptionCollection = {};

    if (this.extends.length > 0) {
      for (const extendedRuleset of this.extends) {
        Object.assign(exceptions, extendedRuleset.exceptions);
      }
    }

    if (this.definition.except !== void 0) {
      // mergeExceptions(exceptions, this.definition.except, this.uri);
    }

    return exceptions;
  }

  public get rules(): Record<string, Rule> {
    if (!('extends' in this.definition)) {
      const rules: Record<string, Rule> = {};
      for (const [name, rule] of Object.entries(this.definition.rules)) {
        assertValidRule(rule); // todo: move it to json schema
        rules[name] = new Rule(name, rule);

        if (rule.formats !== void 0) {
          for (const format of rule.formats) {
            this.formats.add(format);
          }
        }
      }

      return rules;
    }

    const rules: Record<string, Rule> = {};

    if (this.extends.length > 0) {
      for (const extendedRuleset of this.extends) {
        Object.assign(rules, extendedRuleset.rules);
      }
    }

    if ('rules' in this.definition) {
      mergeRules(rules, this.definition.rules);
    }

    for (const [name, rule] of Object.entries(rules)) {
      if (rule.isInherited) {
        rule.enabled = this.context.severity === 'all' || (this.context.severity === 'recommended' && rule.recommended);
        continue;
      }

      if (this.definition.documentationUrl !== void 0 && rule.documentationUrl === void 0) {
        rule.documentationUrl = `${this.definition.documentationUrl}#${name}`;
      }

      if (this.definition.formats !== void 0 && rule.formats === void 0) {
        rule.formats = this.definition.formats;
      }

      if (rule.formats !== void 0) {
        for (const format of rule.formats) {
          this.formats.add(format);
        }
      }
    }

    return rules;
  }

  public get parserOptions(): IParserOptions {
    return this.definition.parserOptions ?? DEFAULT_PARSER_OPTIONS;
  }
}
