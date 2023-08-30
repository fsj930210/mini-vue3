export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
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
