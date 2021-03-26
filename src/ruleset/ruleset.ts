import { Rule } from './rule/rule';
import { IParserOptions, RulesetDefinition, FileRulesetSeverity, RulesetExceptionCollection } from './types';
import { DEFAULT_PARSER_OPTIONS } from '../consts';
import { mergeRule } from './mergers/rules';
import { FormatLookup } from '../types';
// import { mergeExceptions } from './mergers/exceptions';

type RulesetContext = {
  severity: FileRulesetSeverity;
};

export class Ruleset {
  protected extends: Ruleset[];
  public formats = new Set<FormatLookup>();

  constructor(protected readonly definition: RulesetDefinition, protected readonly context: RulesetContext) {
    // assertValidRuleset(definition);

    this.extends =
      'extends' in definition
        ? definition.extends.map(extension =>
            Array.isArray(extension)
              ? new Ruleset(extension[0], { severity: extension[1] })
              : new Ruleset(extension, { severity: 'recommended' }),
          )
        : [];

    if (Array.isArray(this.definition.formats)) {
      for (const format of this.definition.formats) {
        this.formats.add(format);
      }
    }

    for (const { formats } of this.extends) {
      for (const format of formats) {
        this.formats.add(format);
      }
    }
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
    const rules: Record<string, Rule> = {};

    if (this.extends.length > 0) {
      for (const extendedRuleset of this.extends) {
        for (const rule of Object.values(extendedRuleset.rules)) {
          rule.enabled =
            this.context.severity === 'all' || (this.context.severity === 'recommended' && rule.recommended);
          rules[rule.name] = rule;
        }
      }
    }

    if ('rules' in this.definition) {
      for (const [name, definition] of Object.entries(this.definition.rules)) {
        const rule = mergeRule(rules[name], name, definition, this);
        rules[name] = rule;

        if (rule.formats !== void 0) {
          for (const format of rule.formats) {
            this.formats.add(format);
          }
        } else if (rule.owner !== this) {
          rule.formats = rule.owner.definition.formats;
        } else if (this.definition.formats !== void 0) {
          rule.formats = this.definition.formats;
        }

        if (this.definition.documentationUrl !== void 0 && rule.documentationUrl === void 0) {
          rule.documentationUrl = `${this.definition.documentationUrl}#${name}`;
        }
      }
    }

    return rules;
  }

  public get parserOptions(): IParserOptions {
    return this.definition.parserOptions ?? DEFAULT_PARSER_OPTIONS;
  }
}
