import { h, getCurrentInstance } from '../../dist/mini-vue3.esm.js';

export const Foo = {
	name: 'Foo',
	setup(props) {
		console.log('foo instance :', getCurrentInstance());
	},
	render() {
		return h('div', {}, 'foo');
	},
};
