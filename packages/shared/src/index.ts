export * from './shapeFlags';

export const extend = Object.assign;

export function isObject(value) {
	return value !== null && typeof value === 'object';
}

export function hasChanged(value, oldValue) {
	return !Object.is(value, oldValue);
}

export function hasOwn(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
