import { h } from '../../dist/mini-vue3.esm.js';

export const Foo = {
	name: 'Foo',
	setup(props, { emit }) {
		emit('add', 1, 2);
		emit('add-foo', 4, 5);
	},
	render() {
		return h('div', {}, 'foo');
	},
};
