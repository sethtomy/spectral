import { Optional } from '@stoplight/types';
import { JSONPathExpression } from 'nimma';

import { DiagnosticSeverity } from '@stoplight/types/dist';
import { getDiagnosticSeverity, DEFAULT_SEVERITY_LEVEL } from '../utils/severity';
import { hasIntersectingElement } from '../../utils/hasIntersectingElement';
import { IDocument } from '../../document';
import { IRuleDefinition, IRuleThen } from './types';
import { FormatLookup, IGivenNode } from '../../types';
import { Ruleset } from '../ruleset';

export class Rule {
  public description: string | null;
  public message: string | null;
  public severity: DiagnosticSeverity;
  public resolved: boolean;
  public formats: Optional<FormatLookup[]>;
  public enabled: boolean;
  public recommended: boolean;
  public documentationUrl: string | null;
  public then: IRuleThen[];
  public given: string[];

  public expressions?: JSONPathExpression[] | null;

  public get isOptimized(): boolean {
    return Array.isArray(this.expressions);
  }

  constructor(
    public readonly name: string,
    public readonly definition: IRuleDefinition,
    public readonly owner: Ruleset,
  ) {
    this.recommended = definition.recommended !== false;
    this.enabled = this.recommended;
    this.description = definition.description ?? null;
    this.message = definition.message ?? null;
    this.documentationUrl = definition.documentationUrl ?? null;
    this.severity = Rule.getNormalizedSeverity(definition.severity);
    this.resolved = definition.resolved !== false;
    this.formats = definition.formats;

    this.then = Array.isArray(definition.then) ? definition.then : [definition.then];
    this.given = Array.isArray(definition.given) ? definition.given : [definition.given];
  }

  public matchesFormat(formats: IDocument['formats']): boolean {
    if (this.formats === void 0) {
      return true;
    }

    return Array.isArray(formats) && hasIntersectingElement(this.formats, formats);
  }

  public optimize(): boolean {
    if (this.expressions !== void 0) return this.isOptimized;

    try {
      this.expressions = this.given.map(given => {
        const expr = new JSONPathExpression(given, stub, stub);
        if (expr.matches === null) {
          throw new Error(`Rule "${this.name}": cannot optimize ${given}`);
        }

        return expr;
      });
    } catch {
      this.expressions = null;
    }

    return this.isOptimized;
  }

  public static getNormalizedSeverity(severity: Optional<string | number>): DiagnosticSeverity {
    if (severity === void 0) {
      return DEFAULT_SEVERITY_LEVEL;
    } else {
      return getDiagnosticSeverity(severity as any);
    }
  }

  public merge(rule: Partial<IRuleDefinition>) {
    // todo:
  }

  public clone(): Rule {
    return new Rule(this.name, this.definition, this.owner);
  }

  public hookup(cb: (rule: Rule, node: IGivenNode) => void): void {
    for (const expr of this.expressions!) {
      expr.onMatch = (value, path): void => {
        cb(this, {
          path,
          value,
        });
      };
    }
  }
}

function stub(): void {
  // nada
}
