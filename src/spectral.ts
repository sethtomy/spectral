import { memoize } from 'lodash-es'; // todo: get rid of that memoize

import { IDocument } from './document';
import { DocumentInventory } from './documentInventory';
import { Runner, RunnerRuntime } from './runner';
import { IConstructorOpts, IResolver, IRunOpts, ISpectralFullResult } from './types';
import { ComputeFingerprintFunc, defaultComputeResultFingerprint } from './utils';
import { Ruleset } from './ruleset/ruleset';
import { DEFAULT_PARSER_OPTIONS } from './consts';
import { getDiagnosticSeverity } from './ruleset/utils/severity';

memoize.Cache = WeakMap;

export * from './types';

export class Spectral {
  private readonly _resolver: IResolver;

  public ruleset?: Ruleset;

  protected readonly runtime: RunnerRuntime;

  private readonly _computeFingerprint: ComputeFingerprintFunc;

  constructor(protected readonly opts: IConstructorOpts) {
    this._computeFingerprint = memoize(opts.computeFingerprint ?? defaultComputeResultFingerprint);
    this._resolver = opts.resolver;
    this.runtime = new RunnerRuntime();
  }

  protected parseDocument(document: IDocument): IDocument {
    let i = -1;
    for (const diagnostic of document.diagnostics.slice()) {
      i++;
      if (diagnostic.code !== 'parser') continue;

      if (diagnostic.message.startsWith('Mapping key must be a string scalar rather than')) {
        diagnostic.severity = getDiagnosticSeverity(
          this.ruleset?.parserOptions.incompatibleValues ?? DEFAULT_PARSER_OPTIONS.incompatibleValues,
        );
      } else if (diagnostic.message.startsWith('Duplicate key')) {
        diagnostic.severity = getDiagnosticSeverity(
          this.ruleset?.parserOptions.duplicateKeys ?? DEFAULT_PARSER_OPTIONS.duplicateKeys,
        );
      }

      if (diagnostic.severity === -1) {
        // @ts-expect-error
        document.diagnostics.splice(i, 1);
        i--;
      }
    }

    return document;
  }

  public async run(target: IDocument, opts: IRunOpts = {}): Promise<ISpectralFullResult> {
    const { ruleset } = this;
    if (!ruleset) {
      throw new Error('no ruleset loaded');
    }

    const document = this.parseDocument(target);

    const inventory = new DocumentInventory(document, this._resolver);
    await inventory.resolve();

    const runner = new Runner(this.runtime, inventory);

    if (document.formats === void 0) {
      const registeredFormats = Object.keys(ruleset.formats);
      const foundFormats = registeredFormats.filter(format =>
        ruleset.formats[format](inventory.resolved, document.source),
      );
      if (foundFormats.length === 0 && opts.ignoreUnknownFormat !== true) {
        document.formats = null;
        if (registeredFormats.length > 0) {
          // runner.addResult(this._generateUnrecognizedFormatError(document));
        }
      } else {
        document.formats = foundFormats;
      }
    }

    await runner.run(ruleset);

    const results = runner.getResults(this._computeFingerprint);

    return {
      context: {
        document,
      },
      results,
    };
  }

  public setRuleset(ruleset: Ruleset): void {
    this.runtime.revoke();
    this.ruleset = ruleset;
  }
}
