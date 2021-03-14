import { ORDER_KEY_ID } from '@stoplight/ordered-object-literal';

const KEYS = Symbol.for(ORDER_KEY_ID);
const traps = {
    ownKeys(target) {
        return KEYS in target ? target[KEYS] : Reflect.ownKeys(target);
    },
};
const trapAccess = (target) => new Proxy(target, traps);

export { KEYS, trapAccess };
