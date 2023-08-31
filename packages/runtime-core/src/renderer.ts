import { isObject } from '@mini-vue3/shared';
import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
	// 这个方法主要是调用patch方法
	patch(vnode, container);
}

function patch(vnode, container) {
	// 判断是element类型还是component vnode.type object就是组件 string就是element
	if (isObject(vnode.type)) {
		// 处理组件
		processComponent(vnode, container);
	} else if (typeof vnode.type === 'string') {
		// 处理element
		processElement(vnode, container);
	}
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
function processElement(vnode, container) {
	// mount
	mountElement(vnode, container);
}
function mountElement(vnode, container) {
	const el = document.createElement(vnode.type);
	const { props, children } = vnode;
	for (const prop in props) {
		const val = props[prop];
		el.setAttribute(prop, val);
	}
	if (typeof children === 'string') {
		el.textContent = children;
	} else if (Array.isArray(children)) {
		mountChildren(vnode, el);
	}
	container.appendChild(el);
}
function mountChildren(vnode, container) {
	vnode.children.forEach((v) => {
		patch(v, container);
	});
}
