import { isObject, shapeFlags } from '@mini-vue3/shared';

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');

export function createVNode(type, props?, children?) {
	const vnode = {
		type,
		props,
		key: props?.key,
		children,
		shapeFlag: getShapeFlag(type),
		el: null,
	};
	if (typeof children === 'string') {
		vnode.shapeFlag |= shapeFlags.TEXT_CHILDREN;
	} else if (Array.isArray(children)) {
		vnode.shapeFlag |= shapeFlags.ARRAY_CHILREN;
	}
	if (vnode.shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
		if (isObject(children)) {
			vnode.shapeFlag |= shapeFlags.SLOT_CHILDREN;
		}
	}
	return vnode;
}

export function createTextNode(text: string) {
	const vnode = createVNode(Text, {}, text);
	return vnode;
}
function getShapeFlag(type) {
	return typeof type === 'string' ? shapeFlags.ELEMENT : shapeFlags.STATEFUL_COMPONENT;
}
