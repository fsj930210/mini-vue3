export * from './shapeFlags';

export const extend = Object.assign;
export const EMPTY_OBJECT = {};
export function isObject(value) {
	return value !== null && typeof value === 'object';
}

export function hasChanged(value, oldValue) {
	return !Object.is(value, oldValue);
}

export function hasOwn(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

export function toHandlerKey(str) {
	return str ? `on${capitalize(str)}` : ``;
}
const camelizeRE = /-(\w)/g;
export function camelize(str) {
	return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
}
// 用来匹配 kebab-case 的情况
// 比如 onTest-event 可以匹配到 T
// 然后取到 T 在前面加一个 - 就可以
// \BT 就可以匹配到 T 前面是字母的位置
const hyphenateRE = /\B([A-Z])/g;
export function hyphenate(str) {
	return str.replace(hyphenateRE, '-$1').toLowerCase();
}
export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
