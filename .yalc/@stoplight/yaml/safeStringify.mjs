import { safeDump } from '@stoplight/yaml-ast-parser';

const safeStringify = (value, options) => typeof value === 'string' ? value : safeDump(value, options);

export { safeStringify };
