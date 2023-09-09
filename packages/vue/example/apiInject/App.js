// 组件 provide 和 inject 功能
import { h, provide, inject } from '../../dist/mini-vue3.esm.js';

const ProviderOne = {
	setup() {
		provide('foo', 'foo');
		provide('bar', 'bar');
	},
	render() {
		return h(Consumer);
	},
};

const ProviderTwo = {
	setup() {
		// override parent value
		provide('foo', 'fooOverride');
		provide('baz', 'baz');
		const foo = inject('foo');
		// 这里获取的 foo 的值应该是 "foo"
		// 这个组件的子组件获取的 foo ，才应该是 fooOverride
		if (foo !== 'foo') {
			throw new Error('Foo should equal to foo');
		}
	},
	render() {
		return h(Consumer);
	},
};

const Consumer = {
	setup() {
		const foo = inject('foo');
		const bar = inject('bar');
		const baz = inject('baz');

		return {
			foo,
			bar,
			baz,
		};
	},
	render() {
		return h('div', {}, `${this.foo}-${this.bar}-${this.baz}`);
	},
};

export default {
	name: 'App',
	setup() {},
	render() {
		return h('div', {}, [h('p', {}, 'apiInject'), h(ProviderOne)]);
	},
};
