import { Fragment, createVNode } from '../vnode';

export function renderSlots(slots, name, props) {
	const slot = slots[name];
	if (slot) {
		// function
		if (typeof slot === 'function') {
			// 这里用了一个div来包裹多了一层，所以需要实现一个Fragment
			// return createVNode('div', {}, slot(props));
			return createVNode(Fragment, {}, slot(props));
		}
		return createVNode(Fragment, {}, slot(props));
	}
}
