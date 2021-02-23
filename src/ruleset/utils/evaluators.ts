export type CJSExport = Partial<{
  exports: object | ESCJSCompatibleExport;
  require: NodeJS.Require;
}>;
export type ESCJSCompatibleExport = Partial<{ default: unknown }>;
export type ContextExport = Partial<{ returnExports: unknown }>;

const isRequiredSupported =
  typeof require === 'function' &&
  typeof require.main === 'object' &&
  require.main !== null &&
  'paths' in require.main &&
  'cache' in require;

export function setFunctionContext(context: unknown, fn: Function) {
  const boundFn = Function.prototype.bind.call(
    fn,
    Object.freeze(Object.defineProperties({}, Object.getOwnPropertyDescriptors(context))),
  );

  Object.assign(boundFn, fn);

  return boundFn;
}
