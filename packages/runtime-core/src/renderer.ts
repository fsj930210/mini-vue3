import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
	// 这个方法主要是调用patch方法
	patch(vnode, container);
}

function patch(vnode, container) {
	// 判断是element类型还是component
	// 处理组件
	processComponent(vnode, container);
	// TODO 处理element
}

function processComponent(vnode, container) {
	// 挂载组件
	mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
	// 创建组件实例
	const instance = createComponentInstance(vnode);
	// 继续处理组件实例
	setupComponent(instance);
	// 调用render
	setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
	// 获取到render函数返回值
	const subTree = instance.render();
	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container);
}
