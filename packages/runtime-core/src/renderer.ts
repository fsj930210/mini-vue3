import { EMPTY_OBJECT, shapeFlags } from '@mini-vue3/shared';
import { createComponentInstance, setupComponent } from './component';
import { Fragment, Text } from './vnode';
import { createAppApi } from './createApp';
import { effect } from '@mini-vue3/reactivity';

export function createRenderer(options: any) {
	const {
		createElement: hostCreateElement,
		patchProps: hostPatchProps,
		insert: hostInsert,
		remove: hostRemove,
		setElementText: hostSetElementText,
	} = options;

	function render(vnode, container) {
		// 这个方法主要是调用patch方法
		patch(null, vnode, container, null);
	}
	// 考虑到更新操作，需要传入更新前后的vnode，所以参数增加
	// n1 更新前的vnode， n2更新后的vnode，如果n1等于null则是mount阶段
	function patch(n1, n2, container, parentComponent) {
		// 判断是element类型还是component vnode.type object就是组件 string就是element
		// 通过shapeFlag位运算判断是否是组件还是elment

		const { shapeFlag, type } = n2;

		switch (type) {
			case Fragment:
				processFragement(n1, n2, container, parentComponent);
				break;
			case Text:
				processText(n1, n2, container);
				break;
			default:
				if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
					// 处理组件
					processComponent(n1, n2, container, parentComponent);
				} else if (shapeFlag & shapeFlags.ELEMENT) {
					// 处理element
					processElement(n1, n2, container, parentComponent);
				}
				break;
		}
	}
	function processText(n1, n2, container) {
		const textNode = (n2.el = document.createTextNode(n2.children));
		container.appendChild(textNode);
	}
	function processFragement(n1, n2, container, parentComponent) {
		mountChildren(n2.children, container, parentComponent);
	}
	function processComponent(n1, n2, container, parentComponent) {
		// 挂载组件
		mountComponent(n2, container, parentComponent);
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
		// 更新时用effect包裹
		// 在跟新后会触发effect回调
		// 更新其实就是重新生成一个vnode跟之前的vnode做精确对比
		effect(() => {
			if (!instance.isMounted) {
				// 获取到render函数返回值
				const { proxy } = instance;
				// 调用render函数绑定this到代理对象上， suntree就是一个vnode
				// vue2是直接绑定到vue实例上，这里是直接绑定到一个proxy
				const subTree = (instance.subTree = instance.render.call(proxy));
				// vnode -> patch
				// vnode -> element -> mountElement
				patch(null, subTree, container, instance);
				// 这里其实才是执行完一次的结果，这里subtree.el一定有值，因为他执行完了一次完整mount
				initialVnode.el = subTree.el;
				instance.isMounted = true;
			} else {
				const { proxy } = instance;
				const subTree = instance.render.call(proxy);
				const prevTree = instance.subTree;
				instance.subTree = subTree;
				patch(prevTree, subTree, container, instance);
			}
		});
	}
	function processElement(n1, n2, container, parentComponent) {
		if (!n1) {
			// mount
			mountElement(n2, container, parentComponent);
		} else {
			patchElement(n1, n2, container, parentComponent);
		}
	}
	function patchElement(n1, n2, container, parentComponent) {
		console.log('patchElement');
		console.log(n1);
		console.log(n2);
		// 更新props
		const prevProps = n1.props || EMPTY_OBJECT;
		const nextProps = n2.props || EMPTY_OBJECT;
		// el从上一次的vnode里面拿
		// 这里nextProps里面是拿不到el的，所以为了下次更新能
		// 拿到el需要做一次赋值
		const el = (n2.el = n1.el);
		patchProp(el, prevProps, nextProps);
		// patchChildren
		patchChilren(n1, n2, container, parentComponent);
	}
	function patchChilren(n1, n2, container, parentComponent) {
		const { shapeFlag: prevShapeFlag, children: c1 } = n1;
		const { shapeFlag: nextShapeFlag, children: c2 } = n2;
		// console.log(nextShapeFlags & shapeFlags.TEXT_CHILDREN);
		// 旧的chilren是 array， 新的是text
		if (nextShapeFlag & shapeFlags.TEXT_CHILDREN) {
			if (prevShapeFlag & shapeFlags.ARRAY_CHILREN) {
				// 1 先unmount移除掉el的children
				unmountChildren(c1);
				// 2 将el的children设置为text
				// hostSetElementText(container, c2);
			}
			// 两个都是text类型 和 arrytotext step 2
			if (c1 !== c2) {
				hostSetElementText(container, c2);
			}
		} else {
			// 新的是array 旧的是text
			if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
				// 1. 先清空
				hostSetElementText(container, '');
				// 2. mountChildren
				mountChildren(n2.children, container, parentComponent);
			}
		}
	}
	function unmountChildren(children) {
		for (let i = 0; i < children.length; i++) {
			const el = children[i].el;
			// remove
			hostRemove(el);
		}
	}
	function patchProp(el, prevProps, nextProps) {
		// 优化 如果两个props相同就不进入逻辑
		if (prevProps !== nextProps) {
			for (const key in nextProps) {
				const prevProp = prevProps[key];
				const nextProp = nextProps[key];
				// case1 更新props
				if (prevProp !== nextProp) {
					hostPatchProps(el, key, prevProp, nextProp);
				}
			}
			// case 3新props里面没有旧props里面的值
			// 优化只有不是空的时候才遍历
			if (prevProps !== EMPTY_OBJECT) {
				for (const key in prevProps) {
					if (!nextProps[key]) {
						hostPatchProps(el, key, prevProps[key], null);
					}
				}
			}
		}
	}
	function mountElement(vnode, container, parentComponent) {
		// 将el存入vnode中，为后面this.$el好拿到el，但是这里的el是不完整的
		// 因为这里只是在mount element时才会调用，而在mount component时el没有
		const el = (vnode.el = hostCreateElement(vnode.type));
		const { props, children, shapeFlag } = vnode;
		// const isOn = (key) => /^on[A-Z]/.test(key);
		for (const prop in props) {
			const val = props[prop];
			hostPatchProps(el, prop, null, val);
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
			mountChildren(vnode.children, el, parentComponent);
		}
		// container.appendChild(el);
		hostInsert(el, container);
	}
	function mountChildren(children, container, parentComponent) {
		children.forEach((v) => {
			patch(null, v, container, parentComponent);
		});
	}
	return {
		createApp: createAppApi(render),
	};
}
