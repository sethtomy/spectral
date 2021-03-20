import { Dictionary } from '@stoplight/types';
import * as fs from 'fs';
import { html, json, junit, stylish, teamcity, text } from '../formatters';
import { Formatter, FormatterOptions } from '../formatters/types';
import { IRuleResult } from '../../types';
import { OutputFormat } from '../../types/config';

const formatters: Dictionary<Formatter, OutputFormat> = {
  json,
  stylish,
  junit,
  html,
  text,
  teamcity,
};

export function formatOutput(results: IRuleResult[], format: OutputFormat, formatOptions: FormatterOptions): string {
  return formatters[format](results, formatOptions);
}

export async function writeOutput(outputStr: string, outputFile?: string) {
  if (outputFile) {
    return fs.promises.writeFile(outputFile, outputStr);
  }

  console.log(outputStr);
}
