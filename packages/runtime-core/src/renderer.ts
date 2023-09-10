import { EMPTY_OBJECT, isSameVnodeType, shapeFlags } from '@mini-vue3/shared';
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
		patch(null, vnode, container, null, null);
	}
	// 考虑到更新操作，需要传入更新前后的vnode，所以参数增加
	// n1 更新前的vnode， n2更新后的vnode，如果n1等于null则是mount阶段
	function patch(n1, n2, container, parentComponent, anchor) {
		// 判断是element类型还是component vnode.type object就是组件 string就是element
		// 通过shapeFlag位运算判断是否是组件还是elment

		const { shapeFlag, type } = n2;

		switch (type) {
			case Fragment:
				processFragement(n1, n2, container, parentComponent, anchor);
				break;
			case Text:
				processText(n1, n2, container);
				break;
			default:
				if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
					// 处理组件
					processComponent(n1, n2, container, parentComponent, anchor);
				} else if (shapeFlag & shapeFlags.ELEMENT) {
					// 处理element
					processElement(n1, n2, container, parentComponent, anchor);
				}
				break;
		}
	}
	function processText(n1, n2, container) {
		const textNode = (n2.el = document.createTextNode(n2.children));
		container.appendChild(textNode);
	}
	function processFragement(n1, n2, container, parentComponent, anchor) {
		mountChildren(n2.children, container, parentComponent, anchor);
	}
	function processComponent(n1, n2, container, parentComponent, anchor) {
		// 挂载组件
		mountComponent(n2, container, parentComponent, anchor);
	}
	function mountComponent(initialVnode, container, parentComponent, anchor) {
		// 创建组件实例
		const instance = createComponentInstance(initialVnode, parentComponent);
		// 继续处理组件实例
		setupComponent(instance);
		// 调用render
		setupRenderEffect(instance, initialVnode, container, anchor);
	}
	function setupRenderEffect(instance, initialVnode, container, anchor) {
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
				patch(null, subTree, container, instance, anchor);
				// 这里其实才是执行完一次的结果，这里subtree.el一定有值，因为他执行完了一次完整mount
				initialVnode.el = subTree.el;
				instance.isMounted = true;
			} else {
				const { proxy } = instance;
				const subTree = instance.render.call(proxy);
				const prevTree = instance.subTree;
				instance.subTree = subTree;
				patch(prevTree, subTree, container, instance, anchor);
			}
		});
	}
	function processElement(n1, n2, container, parentComponent, anchor) {
		if (!n1) {
			// mount
			mountElement(n2, container, parentComponent, anchor);
		} else {
			patchElement(n1, n2, container, parentComponent, anchor);
		}
	}
	function patchElement(n1, n2, container, parentComponent, anchor) {
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
		patchChilren(n1, n2, el, parentComponent, anchor);
	}
	function patchChilren(n1, n2, container, parentComponent, anchor) {
		const { shapeFlag: prevShapeFlag, children: c1 } = n1;
		const { shapeFlag: nextShapeFlag, children: c2 } = n2;
		// children要么是text要么是array
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
				mountChildren(n2.children, container, parentComponent, anchor);
			} else {
				// 新旧都是array
				patchKeyedChildren(c1, c2, container, parentComponent, anchor);
			}
		}
	}
	function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
		let i = 0;
		const l2 = c2.length;
		let e1 = c1.length - 1;
		let e2 = l2 - 1;
		// step1
		// 左侧对比，左侧相同 右侧不同
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i];
			if (isSameVnodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, anchor);
			} else {
				break;
			}
			i++;
		}
		// step2
		// 右侧对比，左侧不同 右侧相同
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2];
			if (isSameVnodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, anchor);
			} else {
				break;
			}
			e1--;
			e2--;
		}
		// 新的比老的长，创建
		// 若是在左侧增加 i在经过step2后 i = 0, e1 = -1
		// 若是在右侧增加 i在经过step1后 i = e1 + 1 此时再判断c2该位置上是否有元素
		if (i > e1) {
			if (i <= e2) {
				// 锚点的位置就是c2的e2 + 1上，然后取el
				const nextPos = e2 + 1;
				const anchor = nextPos < l2 ? c2[nextPos].el : null;
				// 循环创建 增加多个节点
				while (i <= e2) {
					patch(null, c2[i], container, parentComponent, anchor);
					i++;
				}
			}
		} else if (i > e2) {
			// 旧的比新的长，删除
			// 左边删除时e2为-1
			while (i <= e1) {
				hostRemove(c1[i].el);
				i++;
			}
		} else {
			// 中间对比
			let s1 = i;
			let s2 = i;
			// 优化
			// 这些就是需要patched的数量
			const toBePatched = e2 - s2 + 1;
			let patched = 0;
			// 先创建一个map缓存新的key对应的index
			const newIndexMap = new Map();
			for (let i = s2; i <= e2; i++) {
				const nextChild = c2[i];
				newIndexMap.set(nextChild.key, i);
			}
			for (let i = s1; i <= e1; i++) {
				const prevChild = c1[i];
				// 如果patch完了新的children，则老children后面的直接全部删除
				// 不再执行后面的逻辑
				if (patched >= toBePatched) {
					hostRemove(prevChild.el);
					// 继续循环
					continue;
				}
				let newIndex;
				// 删除中间的，即老的有，新的没有
				// 两种方案 根据key删除，遍历删除
				if (prevChild.key !== null && prevChild.key !== undefined) {
					// 根据key删除
					newIndex = newIndexMap.get(prevChild.key);
				} else {
					// 遍历删除
					for (let j = s2; j < e2; j++) {
						if (isSameVnodeType(prevChild, c2[j])) {
							newIndex = j;
							break;
						}
					}
				}
				if (newIndex === undefined) {
					hostRemove(prevChild.el);
				} else {
					patch(prevChild, c2[newIndex], container, parentComponent, null);
					patched++;
				}
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
	function mountElement(vnode, container, parentComponent, anchor) {
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
			mountChildren(vnode.children, el, parentComponent, anchor);
		}
		// container.appendChild(el);
		hostInsert(el, container, anchor);
	}
	function mountChildren(children, container, parentComponent, anchor) {
		children.forEach((v) => {
			patch(null, v, container, parentComponent, anchor);
		});
	}
	return {
		createApp: createAppApi(render),
	};
}
