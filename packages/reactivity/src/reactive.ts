import { track, trigger } from './effect'
export function reactive(raw) {
  return new Proxy(raw, {
    // {foo: 1}
    // target -> {foo: 1}
    // key -> foo
    get(target, key) {
      const res = Reflect.get(target,key);
      track(target, key);
      return res;
    },
    set(target, key, newValue) {
      const res = Reflect.set(target, key, newValue);
      trigger(target,key);
      return res;
    }
  })
}
