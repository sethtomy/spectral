import { assertValidRule, assertValidRuleset } from './validation';
import { Rule } from './rule/rule';
import {
  IParserOptions,
  RulesetDefinition,
  FileRulesetSeverity,
  RulesetExceptionCollection,
} from './types';
import { DEFAULT_PARSER_OPTIONS } from '../consts';
import { mergeRules } from './mergers/rules';
import {FormatLookup} from "../types";
// import { mergeExceptions } from './mergers/exceptions';

type RulesetContext = {
  severity: FileRulesetSeverity;
};

export class Ruleset {
  protected extends: [Ruleset, FileRulesetSeverity][] | null;
  protected formats = new Set<FormatLookup>();

  constructor(protected readonly definition: RulesetDefinition, protected readonly context: RulesetContext) {
    assertValidRuleset(definition);

    this.extends =
  }

  public get exceptions(): RulesetExceptionCollection | null {
    if ((this.extends === null || this.extends.length === 0) && this.definition.except === void 0) {
      return null;
    }

    const exceptions: RulesetExceptionCollection = {};

    if (this.extends !== null && this.extends.length > 0) {
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


        for (const format of rule.formats) {
          this.formats.add(format);
        }
      }

      return rules;
    }

    const rules: Record<string, Rule> = {};

    if (this.extends.length > 0) {
      for (const [extendedRuleset] of this.extends) {
        Object.assign(rules, extendedRuleset.rules);
      }
    }

    mergeRules(rules, this.definition.rules);

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

      for (const format of rule.formats) {
        this.formats.add(format);
      }
    }

    return rules;
  }

  public get parserOptions(): IParserOptions {
    return this.definition.parserOptions ?? DEFAULT_PARSER_OPTIONS;
  }
}
