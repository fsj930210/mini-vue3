// 老的是 array
// 新的是 text

import { ref, h } from '../../dist/mini-vue3.esm.js';
const nextChildren = 'newChildren';
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')];

export default {
	name: 'ArrayToText',
	setup() {
		const isChange = ref(false);
		window.isChange = isChange;

		return {
			isChange,
		};
	},
	render() {
		const self = this;
		console.log(self.isChange);
		return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren);
	},
};
