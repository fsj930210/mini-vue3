import { shallowReadonly } from 'packages/reactivity/src/reactive';
import { initProps } from './componentProps';
import { publicInstanceProxyHandlers } from './componentPublicInstance';

export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
		props: {},
	};
	return component;
}

export function setupComponent(instance) {
	// init props
	initProps(instance, instance.vnode.props);
	// TODO
	// init slots
	// 处理有状态的组件
	setupStatefulComponent(instance);
}
// 有状态的setup组件
function setupStatefulComponent(instance) {
	// 拿到组件
	const Component = instance.type;
	// 给实例绑定setup返回值属性及内部属性，通过代理，如通过this.xxx而不是this.x.x
	// 这里代码优化, 将逻辑抽离
	instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
	const { setup } = Component;
	if (setup) {
		const setupResult = setup(shallowReadonly(instance.props));
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
