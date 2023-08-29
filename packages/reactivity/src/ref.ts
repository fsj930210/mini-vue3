import { hasChanged, isObject } from '@mini-vue3/shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';
import { createDep } from './dep';

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
		this.dep = createDep();
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

export function trackRefValue(ref) {
	if (isTracking()) {
		trackEffects(ref.dep);
	}
}
export function triggerRefValue(ref) {
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
// 这里没有处理 objectWithRefs 是 reactive 类型的时候
// TODO reactive 里面如果有 ref 类型的 key 的话， 那么也是不需要调用 ref.value 的
// （but 这个逻辑在 reactive 里面没有实现）
export function proxyRefs(objectWithRefs) {
	return new Proxy(objectWithRefs, {
		get(target, key) {
			return unRef(Reflect.get(target, key));
		},
		set(target, key, newValue) {
			const oldValue = target[key];
			if (isRef(oldValue) && !isRef(newValue)) {
				return (target[key].value = newValue);
			} else {
				return Reflect.set(target, key, newValue);
			}
		},
	});
}
