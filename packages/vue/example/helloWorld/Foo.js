import { h, ref } from '../../dist/mini-vue3.esm.js';

export const Foo = {
	setup(props) {
		// 1. props 可以通过setup传入
		// 2. 可以通过this.xxx访问props的值
		// 3. props是readonly 只读的
		console.log('Foo props', props);
		props.count++;
	},
	render() {
		return h('div', {}, 'foo: ' + this.count);
	},
};
