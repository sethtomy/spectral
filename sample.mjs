import { Spectral, Document, Parsers } from './dist/index.mjs';
import OasRuleset from './dist/rulesets/oas/index.mjs';
import { Ruleset } from './dist/ruleset/ruleset.mjs';
import { httpAndFileResolver } from './dist/resolvers/http-and-file.mjs';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

const source = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  './src/__tests__/__fixtures__/petstore.oas3.json',
);
const myOpenApiDocument = new Document(fs.readFileSync(source, 'utf8'), Parsers.Json, source);

const spectral = new Spectral({
  resolver: httpAndFileResolver,
});
spectral.setRuleset(new Ruleset(OasRuleset, { severity: 'recommended' }));
spectral.run(myOpenApiDocument);
