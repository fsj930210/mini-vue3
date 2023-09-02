import { h } from '../../dist/mini-vue3.esm.js';
import { Foo } from './Foo.js';

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
			h(Foo, {}, h('span', {}, 'slots')),
		]);
	},
};
