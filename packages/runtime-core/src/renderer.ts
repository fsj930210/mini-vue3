import { shapeFlags } from '@mini-vue3/shared';
import { createComponentInstance, setupComponent } from './component';
import { Fragment, Text } from './vnode';
import { createAppApi } from './createApp';

export function createRenderer(options: any) {
	const { createElement, patchProps, insert } = options;

	function render(vnode, container) {
		// 这个方法主要是调用patch方法
		patch(vnode, container, null);
	}

	function patch(vnode, container, parentComponent) {
		// 判断是element类型还是component vnode.type object就是组件 string就是element
		// 通过shapeFlag位运算判断是否是组件还是elment

		const { shapeFlag, type } = vnode;

		switch (type) {
			case Fragment:
				processFragement(vnode, container, parentComponent);
				break;
			case Text:
				processText(vnode, container);
				break;
			default:
				if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
					// 处理组件
					processComponent(vnode, container, parentComponent);
				} else if (shapeFlag & shapeFlags.ELEMENT) {
					// 处理element
					processElement(vnode, container, parentComponent);
				}
				break;
		}
	}
	function processText(vnode, container) {
		const textNode = (vnode.el = document.createTextNode(vnode.children));
		container.appendChild(textNode);
	}
	function processFragement(vnode, container, parentComponent) {
		mountChildren(vnode, container, parentComponent);
	}
	function processComponent(vnode, container, parentComponent) {
		// 挂载组件
		mountComponent(vnode, container, parentComponent);
	}
	function mountComponent(initialVnode, container, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(initialVnode, parentComponent);
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
		patch(subTree, container, instance);
		// 这里其实才是执行完一次的结果，这里subtree.el一定有值，因为他执行完了一次完整mount
		initialVnode.el = subTree.el;
	}
	function processElement(vnode, container, parentComponent) {
		// mount
		mountElement(vnode, container, parentComponent);
	}
	function mountElement(vnode, container, parentComponent) {
		// 将el存入vnode中，为后面this.$el好拿到el，但是这里的el是不完整的
		// 因为这里只是在mount element时才会调用，而在mount component时el没有
		const el = (vnode.el = createElement(vnode.type));
		const { props, children, shapeFlag } = vnode;
		// const isOn = (key) => /^on[A-Z]/.test(key);
		for (const prop in props) {
			const val = props[prop];
			patchProps(el, prop, val);
			// if (isOn(prop)) {
			// 	const eventName = prop.slice(2).toLocaleLowerCase();
			// 	el.addEventListener(eventName, val);
			// } else {
			// 	el.setAttribute(prop, val);
			// }
		}
		if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
			// text_children
			el.textContent = children;
		} else if (shapeFlag & shapeFlags.ARRAY_CHILREN) {
			// array_children
			mountChildren(vnode, el, parentComponent);
		}
		// container.appendChild(el);
		insert(el, container);
	}
	function mountChildren(vnode, container, parentComponent) {
		vnode.children.forEach((v) => {
			patch(v, container, parentComponent);
		});
	}
	return {
		createApp: createAppApi(render),
	};
}
