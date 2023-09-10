import { initProps } from './componentProps';
import { publicInstanceProxyHandlers } from './componentPublicInstance';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';
import { proxyRefs, shallowReadonly } from '@mini-vue3/reactivity';
let currentInstance = null;
export function createComponentInstance(vnode, parent) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
		props: {},
		slots: {},
		provides: parent ? parent.provides : {},
		parent,
		subTree: {},
		next: null, // 当前组件下次更新的vnode
		isMounted: false, // 判断是更新还是初始化
		emit: () => {},
	};
	component.emit = emit.bind(null, component) as any;
	return component;
}
export function getCurrentInstance() {
	return currentInstance;
}
function setCurrentInstance(instance) {
	currentInstance = instance;
}
export function setupComponent(instance) {
	// init props
	initProps(instance, instance.vnode.props);
	// init slots
	initSlots(instance, instance.vnode.children);
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
		setCurrentInstance(instance);
		const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
		setCurrentInstance(null);
		// 处理setup返回值 可以返回function也可以返回object
		handleSetupResult(instance, setupResult);
	}
}
function handleSetupResult(instance, setupResult) {
	// TODO function
	if (typeof setupResult === 'object') {
		// 将返回值存入到instance上
		// 自动解包
		instance.setupState = proxyRefs(setupResult);
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
