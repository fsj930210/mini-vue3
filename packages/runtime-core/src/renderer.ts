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
function mountComponent(initialVnode, container) {
	// 创建组件实例
	const instance = createComponentInstance(initialVnode);
	// 继续处理组件实例
	setupComponent(instance);
	// 调用render
	setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
	// 获取到render函数返回值
	const { proxy } = instance;
	// 调用render函数绑定this到代理对象上， suntree就是一个vnode
	// vue2是直接绑定到vue实例上，这里是直接绑定到一个proxy
	const subTree = instance.render.call(proxy);
	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container);
	// 这里其实才是执行完一次的结果，这里subtree.el一定有值，因为他执行完了一次完整mount
	initialVnode.el = subTree.el;
}
function processElement(vnode, container) {
	// mount
	mountElement(vnode, container);
}
function mountElement(vnode, container) {
	// 将el存入vnode中，为后面this.$el好拿到el，但是这里的el是不完整的
	// 因为这里只是在mount element时才会调用，而在mount component时el没有
	const el = (vnode.el = document.createElement(vnode.type));
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
