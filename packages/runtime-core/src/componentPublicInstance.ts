const publicPropertiesMap = {
	$el: (instance) => instance.vnode.el,
};
export const publicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		// 绑定setup的返回值
		const { setupState } = instance;
		if (key in setupState) {
			return setupState[key];
		}
		const publicGetter = publicPropertiesMap[key];
		if (publicGetter) {
			return publicGetter(instance);
		}
	},
};
