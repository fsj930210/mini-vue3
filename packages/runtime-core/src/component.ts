export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
	};
	return component;
}

export function setupComponent(instance) {
	// TODO
	// init props
	// init slots
	// 处理有状态的组件
	setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
	// 拿到组件
	const Component = instance.type;
	// 给实例绑定setup返回值属性及内部属性，通过代理，如通过this.xxx而不是this.x.x
	instance.proxy = new Proxy(
		{},
		{
			get(target, key) {
				// 绑定setup的返回值
				const { setupState } = instance;
				if (key in setupState) {
					return setupState[key];
				}
			},
		}
	);
	const { setup } = Component;
	if (setup) {
		const setupResult = setup();
		// 处理setup返回值 可以返回function也可以返回object
		handleSetupResult(instance, setupResult);
	}
}
function handleSetupResult(instance, setupResult) {
	// TODO function
	if (typeof setupResult === 'object') {
		// 将返回值存入到instance上
		instance.setupState = setupResult;
	}
	// 保证实例render函数有返回值
	finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
	const Component = instance.type;
	if (Component.render) {
		instance.render = Component.render;
	}
}
