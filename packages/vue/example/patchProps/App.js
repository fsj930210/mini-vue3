// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from '../../dist/mini-vue3.esm.js';

export default {
	name: 'App',
	setup() {
		const props = ref({
			foo: 'foo',
			bar: 'bar',
			baz: 'baz',
		});
		const changeProps1 = () => {
			props.value.foo = 'foo1';
		};
		const changeProps2 = () => {
			props.value.bar = undefined;
		};
		const changeProps3 = () => {
			props.value = {
				foo: 'foo34',
			};
		};
		return {
			msg,
			props,
			changeProps2,
			changeProps3,
			changeProps1,
		};
	},

	render() {
		return h('div', { ...this.props }, [
			h('div', {}, '你好'),
			h(
				'button',
				{
					onClick: this.changeProps1,
				},
				'更改props为新的值'
			),
			h(
				'button',
				{
					onClick: this.changeProps2,
				},
				'将props中的一个值设置为undefined'
			),
			h(
				'button',
				{
					onClick: this.changeProps3,
				},
				'更新后的props不包含旧props中的值'
			),
		]);
	},
};
