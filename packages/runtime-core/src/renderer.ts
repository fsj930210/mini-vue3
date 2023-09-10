import { EMPTY_OBJECT, isSameVnodeType, shapeFlags } from '@mini-vue3/shared';
import { createComponentInstance, setupComponent } from './component';
import { Fragment, Text } from './vnode';
import { createAppApi } from './createApp';
import { effect } from '@mini-vue3/reactivity';
import { shouldUpdateComponent } from "./componentRenderUtils";

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
		if (!n1) {
			// 挂载组件
			mountComponent(n2, container, parentComponent, anchor);
		} else {
			updateComponent(n1, n2)
		}
	}
	function updateComponent(n1, n2) {
		// 怎么更新组件，只需要重新生成新的vnode，然后patch
		// 在mount时我们调用了一个effect，effect的回调就是具体的更新逻辑
		// effect会返回一个runner，执行runner就会重新执行回调
		// 所以在mount时需要存一下effect的返回值
		// 这里需要拿到实例
		// 再在实例上存入下次的vnode
		const instance = (n2.component = n1.component);
		// 这里有一个优化点，父组件更新的数据跟子组件没关系，此时其实不应该更新子组件
		if (shouldUpdateComponent(n1, n2)) {
			instance.next = n2;
			instance.update();
		} else {
			console.log(`组件不需要更新: ${instance}`);
			// 不需要更新的话，那么只需要覆盖下面的属性即可
			n2.component = n1.component;
			n2.el = n1.el;
			instance.vnode = n2;
		}
	}
	function mountComponent(initialVnode, container, parentComponent, anchor) {
		// 创建组件实例 并存入vnode中
		const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
		// 继续处理组件实例
		setupComponent(instance);
		// 调用render
		setupRenderEffect(instance, initialVnode, container, anchor);
	}
	function setupRenderEffect(instance, initialVnode, container, anchor) {
		// 更新时用effect包裹
		// 在跟新后会触发effect回调
		// 更新其实就是重新生成一个vnode跟之前的vnode做精确对比
		instance.update = effect(() => {
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
				// 响应式的值变更后会从这里执行逻辑
				// 主要就是拿到新的 vnode ，然后和之前的 vnode 进行对比
				console.log(`${instance.type.name}:调用更新逻辑`);
				// 拿到最新的 subTree
				const { next, vnode } = instance;
				// 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
        // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
				if(next) {
					next.el = vnode.el;
					updateComponentPreRender(instance, next);
				}
				const { proxy } = instance;
				const subTree = instance.render.call(proxy);
				const prevTree = instance.subTree;
				instance.subTree = subTree;
				patch(prevTree, subTree, container, instance, anchor);
			}
		});
	}
	function updateComponentPreRender(instance, nextVNode) {
		// 更新 nextVNode 的组件实例
		// 现在 instance.vnode 是组件实例更新前的
		// 所以之前的 props 就是基于 instance.vnode.props 来获取
		// 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
		nextVNode.component = instance;
		// TODO 后面更新 props 的时候需要对比
		// const prevProps = instance.vnode.props;
		instance.vnode = nextVNode;
		instance.next = null;

		const { props } = nextVNode;
		console.log("更新组件的 props", props);
		instance.props = props;
		console.log("更新组件的 slots");
    // TODO 更新组件的 slots
    // 需要重置 vnode
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
			// 已经patch的数量
			let patched = 0;
			// 先创建一个map缓存新的key对应的index
			const newIndexMap = new Map();
			// 创建一个定长数组
			const newIndexToOldIndexMap = new Array(toBePatched);
			// 移动flag
			let moved = false;
			let maxNewIndexSoFar = 0;
			for (let i = 0; i < toBePatched; i++) {
				// 0代表还没有建立映射关系
				newIndexToOldIndexMap[i] = 0;
			}
			
			for (let i = s2; i <= e2; i++) {
				const nextChild = c2[i];
				newIndexMap.set(nextChild.key, i);
			}
			// 遍历旧的children
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
					// 这里需写上j<=e2如果不写等于走的是创建逻辑
					// 写上走的是移动逻辑
					// 具体可以debug example fix
					// for (let j = s2; j < e2; j++) {
					for (let j = s2; j <= e2; j++) {
						if (isSameVnodeType(prevChild, c2[j])) {
							newIndex = j;
							break;
						}
					}
				}
				// newIndex不存在则代表当前节点不在新children中，需要删除
				if (newIndex === undefined) {
					hostRemove(prevChild.el);
				} else {
					// 来确定中间的节点是不是需要移动
          // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
          // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
          // 不是升序的话，我们就可以确定节点移动过了
					if (newIndex >= maxNewIndexSoFar) {
						maxNewIndexSoFar = newIndex;
					} else {
						moved = true;
					}
					// newIndex是从新children最开始(0)算的而需要存的是中间部分
					// 把中间部分当成一个新的数组，所以需要减去s2
					// i 就是在旧children的索引 i 有可能为0
					// i为0代表新节点在老节点里面没有需要创建
					// 所以这里需要+1
					newIndexToOldIndexMap[newIndex - s2] = i + 1;
					// 存在则继续patch
					patch(prevChild, c2[newIndex], container, parentComponent, null);
					patched++;
				}
			}
			// 利用最长递增子序列来优化移动逻辑
      // 因为元素是升序的话，那么这些元素就是不需要移动的
      // 而我们就可以通过最长递增子序列来获取到升序的列表
      // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
      // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
      // getSequence 返回的是 newIndexToOldIndexMap 的索引值
      // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
			const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
			// 最长递增子序列的索引
			// let j = 0;
			let j = increasingNewIndexSequence.length - 1;
			// 遍历新节点
			// 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
			// 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]

			// 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
			// 因为 insert 逻辑是使用的 insertBefore()
			// for (let i = 0; i < toBePatched; i++) {
			// 	// 不想等则不是在递增子序列里面则需要移动
			// 	if (i !== increasingNewIndexSequence[j]) {
			// 		console.log('移动位置')
			// 	} else {
			// 		j++
			// 	}
			// }
			for (let i = toBePatched - 1; i >= 0; i--) {
				// 这个是在新chidlren里面的索引
				const nextIndex = i + s2;
				const nextChild = c2[nextIndex];
				const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
				// 代表老节点没有新节点有新增
				if (newIndexToOldIndexMap[i] === 0) {
					patch(null, nextChild, container, parentComponent, anchor)
				} else if (moved) {
					// 新节点对比老节点移动过菜执行下面的逻辑
					// j < 0 则没有递增子序列 需要移动
					// 不相等则不是在递增子序列里面则需要移动
					if (j < 0 || i !== increasingNewIndexSequence[j]) {
						console.log('移动位置');
						hostInsert(nextChild.el, container, anchor);
					} else {
						j--
					}
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
function getSequence(arr: number[]): number[] {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = (u + v) >> 1;
				if (arr[result[c]] < arrI) {
					u = c + 1;
				} else {
					v = c;
				}
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) {
					p[i] = result[u - 1];
				}
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}