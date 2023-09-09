// 可以在 setup 中使用 getCurrentInstance 获取组件实例对象
import { h, getCurrentInstance } from '../../dist/mini-vue3.esm.js';
import { Foo } from './Foo.js';
export default {
	name: 'App',
	setup() {
		console.log('App instance: ', getCurrentInstance());
	},
	render() {
		return h('div', {}, [h('p', {}, 'getCurrentInstance'), h(Foo)]);
	},
};
