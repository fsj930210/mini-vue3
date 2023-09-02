import { h, renderSlots } from '../../dist/mini-vue3.esm.js';

export const Foo = {
	name: 'Foo',
	setup(props, { emit }) {},
	render() {
		const Child = h('div', {}, 'child foo');
		console.log(this.$slots);
		return h('div', {}, [Child, renderSlots(this.$slots)]);
	},
};

export const Foo1 = {
	name: 'Foo1',
	setup(props, { emit }) {},
	render() {
		const Child = h('div', {}, 'child foo');
		console.log(this.$slots);
		return h('div', {}, [renderSlots(this.$slots, 'header'), Child, renderSlots(this.$slots, 'footer')]);
	},
};
