// import { render } from './renderer';
import { createVNode } from './vnode';
export function createAppApi(render) {
	return function createApp(rootComponent) {
		return {
			mount(rootContainer) {
				// 转化为vnode 虚拟节点
				// component -> vnode
				// 后续所有操作都基于vnode
				const vnode = createVNode(rootComponent);
				// 通过render函数做进一步处理
				render(vnode, rootContainer);
			},
		};
	};
}
