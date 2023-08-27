import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandler';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}

function createReactiveObject(raw: any, baseHandler) {
  return new Proxy(raw, baseHandler);
}
export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}