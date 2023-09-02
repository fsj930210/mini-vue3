export function initSlots(instance, slots) {
	instance.slots = Array.isArray(slots) ? slots : [slots];
}
