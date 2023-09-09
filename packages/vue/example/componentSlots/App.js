import { h, createTextNode } from '../../dist/mini-vue3.esm.js';
import { Foo, Foo1, Foo2 } from './Foo.js';

export default {
	name: 'App',
	setup() {
		return {
			msg: 'hello mini-vue3',
		};
	},

	render() {
		return h('div', { tId: 1 }, [
			h(
				'h1',
				{
					onClick: () => {
						console.log('onClick');
					},
				},
				this.msg
			),
			createTextNode('我是文本节点呀'),
			// h(Foo, {}, h('span', {}, 'slot 是一个vnode')),
			// h(Foo, {}, [h('span', {}, 'slot vnode数组'), h('span', { style: 'margin-left:8px' }, 'slot vnode数组')]),
			// h(
			// 	Foo1,
			// 	{},
			// 	{
			// 		header: h('header', {}, 'slot是具名-header'),
			// 		footer: h('footer', {}, 'slot是具名-footer'),
			// 	}
			// ),
			h(
				Foo2,
				{},
				{
					header: ({ age }) => h('header', {}, 'slot是具名-header' + age),
					footer: ({ age }) => h('footer', {}, 'slot是具名-footer' + age),
				}
			),
		]);
	},
};
