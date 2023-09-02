export function initSlots(instance, chilrdren) {
	// instance.slots = Array.isArray(chilrdren) ? chilrdren : [chilrdren];

	normalizeObjectSlots(chilrdren, instance.slots);
}

function normalizeSlotValue(value) {
	return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
	for (const key in children) {
		const value = children[key];
		slots[key] = normalizeSlotValue(value);
	}
}
