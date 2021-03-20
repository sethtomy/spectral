import { Document, STDIN } from '../../../document';
import { readParsable, IFileReadOptions } from '../../../fs/reader';
import * as Parsers from '../../../parsers';
import { IRuleResult, Spectral } from '../../../spectral';
import { ILintConfig } from '../../../types/config';
import { getRuleset, listFiles, segregateEntriesPerKind, readFileDescriptor } from './utils';
import { getResolver } from './utils/getResolver';
import { YamlParserResult } from '@stoplight/yaml';

export async function lint(documents: Array<number | string>, flags: ILintConfig): Promise<IRuleResult[]> {
  const spectral = new Spectral({
    resolver: getResolver(flags.resolver),
  });

  const ruleset = await getRuleset(flags.ruleset);
  spectral.setRuleset(ruleset);

  const [globs, fileDescriptors] = segregateEntriesPerKind(documents);
  const [targetUris, unmatchedPatterns] = await listFiles(
    globs,
    !(flags.showUnmatchedGlobs || flags.failOnUnmatchedGlobs),
  );
  const results: IRuleResult[] = [];

  if (unmatchedPatterns.length > 0 && flags.failOnUnmatchedGlobs) {
    throw new Error(`Unmatched glob patterns: \`${unmatchedPatterns.join(',')}\``);
  }

  for (const targetUri of [...targetUris, ...fileDescriptors]) {
    const document = await createDocument(targetUri, { encoding: flags.encoding });

    results.push(
      ...(
        await spectral.run(document, {
          ignoreUnknownFormat: flags.ignoreUnknownFormat,
        })
      ).results,
    );
  }

  return results;
}

const createDocument = async (
  identifier: string | number,
  opts: IFileReadOptions,
): Promise<Document<unknown, YamlParserResult<unknown>>> => {
  if (typeof identifier === 'string') {
    return new Document(await readParsable(identifier, opts), Parsers.Yaml, identifier);
  }

  return new Document(await readFileDescriptor(identifier, opts), Parsers.Yaml, STDIN);
};
