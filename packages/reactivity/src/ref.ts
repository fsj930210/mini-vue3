import { hasChanged, isObject } from '@mini-vue3/shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';

class RefImpl {
	public dep;
	private _rawValue;
	private _value;
	public __v_isRef = true;
	constructor(_value) {
		this._rawValue = _value;
		// 看看value 是不是一个对象，如果是一个对象的话
		// 那么需要用 reactive 包裹一下
		this._value = convert(_value);
		this.dep = new Set();
	}
	get value() {
		trackRefValue(this);
		return this._value;
	}
	set value(newValue) {
		if (hasChanged(newValue, this._rawValue)) {
			this._rawValue = newValue;
			this._value = convert(newValue);
			triggerRefValue(this);
		}
	}
}

function convert(value) {
	return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
	if (isTracking()) {
		trackEffects(ref.dep);
	}
}
function triggerRefValue(ref) {
	triggerEffects(ref.dep);
}

export function ref(value) {
	const refImpl = new RefImpl(value);
	return refImpl;
}

export function isRef(ref) {
	return !!ref.__v_isRef;
}
export function unRef(ref) {
	return isRef(ref) ? ref.value : ref;
}
