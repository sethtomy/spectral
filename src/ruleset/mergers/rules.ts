import { Optional } from '@stoplight/types';
import { assertValidRule } from '../validation';
import { Rule } from '../rule/rule';
import { FileRuleCollection } from '../types';

function assertExistingRule(maybeRule: Optional<Rule>): asserts maybeRule is Rule {
  if (maybeRule === void 0) {
    throw new ReferenceError('Cannot extend non-existing rule');
  }
}

/*
- if rule is object, simple deep merge (or we could replace to be a bit stricter?)
- if rule is true, use parent rule with it's default severity
- if rule is false, use parent rule but set it's severity to "off"
- if rule is string or number, use parent rule and set it's severity to the given string/number value
*/
export function mergeRules(inheritedRules: Record<string, Rule>, rules: FileRuleCollection): void {
  for (const [name, rule] of Object.entries(rules)) {
    const existingRule = inheritedRules[name];
    inheritedRules[name] = existingRule.clone();
    existingRule.isInherited = true;

    switch (typeof rule) {
      case 'boolean':
        existingRule.enabled = rule;
        break;
      case 'string':
      case 'number':
        assertExistingRule(existingRule);
        existingRule.severity = Rule.getNormalizedSeverity(rule);
        break;
      case 'object':
        if (existingRule !== void 0) {
          existingRule.merge(rule);
        } else {
          assertValidRule(rule);
          inheritedRules[name] = new Rule(name, rule);
        }

        break;
      default:
        throw new Error('Invalid value for a rule');
    }
  }
}
