import { JsonPath } from '@stoplight/types';
import { DocumentInventory } from '../documentInventory';
import type { Rule } from '../ruleset/rule/rule';

export interface IFunctionContext {
  cache: Map<unknown, unknown>;
}

export type IFunction = (
  targetValue: unknown,
  options: unknown,
  paths: IFunctionPaths,
  otherValues: IFunctionValues,
) => void | IFunctionResult[] | Promise<void | IFunctionResult[]>;

export interface IFunctionPaths {
  given: JsonPath;
  target?: JsonPath;
}

export interface IFunctionValues {
  original: any;
  given: any;
  documentInventory: DocumentInventory;
  rule: Rule;
}

export interface IFunctionResult {
  message: string;
  path?: JsonPath;
}
