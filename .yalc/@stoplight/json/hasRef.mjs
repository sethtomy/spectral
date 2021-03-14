import { isObject } from 'lodash-es';

const hasRef = (obj) => isObject(obj) && '$ref' in obj && typeof obj.$ref === 'string';

export { hasRef };
