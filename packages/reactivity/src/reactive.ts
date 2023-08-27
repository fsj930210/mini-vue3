import { mutableHandlers, readonlyHandlers } from './baseHandler';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}

function createActiveObject(raw: any, baseHandler) {
  return new Proxy(raw, baseHandler);
}
export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}