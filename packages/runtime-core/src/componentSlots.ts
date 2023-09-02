import { shapeFlags } from '@mini-vue3/shared';

export function initSlots(instance, chilrdren) {
	// instance.slots = Array.isArray(chilrdren) ? chilrdren : [chilrdren];
	const { vnode } = instance;
	if (shapeFlags.SLOT_CHILDREN & vnode.shapeFlag) {
		normalizeObjectSlots(chilrdren, instance.slots);
	}
}

function normalizeSlotValue(value) {
	return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
	for (const key in children) {
		const value = children[key];
		slots[key] = (props) => normalizeSlotValue(value(props));
	}
}
