import { evaluateExport, setFunctionContext } from '../utils/evaluators';
import type { JSONSchema, IFunction } from '../../types';
import { ValidationError } from '../validation';
import { IFunctionPaths, IFunctionValues } from '../../types';
import { Dictionary } from '@stoplight/types';
import * as AJV from 'ajv';

type CompileOptions = {
  inject: Dictionary<unknown>;
  context: unknown;
};

const ajv = new AJV({ allErrors: true, jsonPointers: true });

export class CustomFunction {
  protected readonly schema: JSONSchema | null;
  protected readonly source: string;
  public compiled?: IFunction;

  constructor(
    public readonly name: string,
    protected readonly uri: string,
    { schema, source }: { schema: JSONSchema | null; source: string },
  ) {
    this.schema = schema;
    this.source = source;
  }

  public compile({ inject, context }: CompileOptions) {
    const exportedFn = evaluateExport(this.source, this.uri, inject);

    const fn =
      this.schema !== null ? decorateIFunctionWithSchemaValidation(exportedFn as any, this.schema) : exportedFn;

    Reflect.defineProperty(fn, 'name', {
      configurable: true,
      value: '', // todo: name
    });

    Object.freeze(fn);

    this.compiled = setFunctionContext(context, fn);
  }
}

function decorateIFunctionWithSchemaValidation(fn: IFunction<any>, schema: JSONSchema) {
  return (data: unknown, opts: unknown, ...args: [IFunctionPaths, IFunctionValues]) => {
    if (!ajv.validate(schema, opts)) {
      throw new ValidationError(ajv.errors ?? []);
    }

    return fn(data, opts, ...args);
  };
}
