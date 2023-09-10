// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from '../../dist/mini-vue3.esm.js';
import Child from './Child.js';

export default {
	name: 'App',
	setup() {
		const props = ref({
			foo: 'foo',
			bar: 'bar',
			baz: 'baz',
		});
		const msg = ref('msg');
		const bar = ref('bar');
		const changeChildProps = () => {
			msg.value = 'msg1122';
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
			changeChildProps,
		};
	},

	render() {
		return h('div', { ...this.props }, [
			h('div', {}, '你好' + this.msg),
			h(
				'button',
				{
					onClick: this.changeChildProps,
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
			// h(Child, {
			// 	msg: this.msg,
			// }),
		]);
	},
};
