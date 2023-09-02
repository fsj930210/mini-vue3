import { hasOwn } from '@mini-vue3/shared';

const publicPropertiesMap = {
	$el: (instance) => instance.vnode.el,
	$slots: (instance) => instance.slots,
};
export const publicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		// 绑定setup的返回值
		const { setupState, props } = instance;
		// if (key in setupState) {
		// 	return setupState[key];
		// }
		if (hasOwn(setupState, key)) {
			return setupState[key];
		} else if (hasOwn(props, key)) {
			return props[key];
		}
		const publicGetter = publicPropertiesMap[key];
		if (publicGetter) {
			return publicGetter(instance);
		}
	},
};
