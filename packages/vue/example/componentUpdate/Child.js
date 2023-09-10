import { h, } from "../../dist/mini-vue3.esm.js";
export default {
  name: "Child",
  setup(props, { emit }) {},
  render(proxy) {
    console.log('子组件更新')
    return h("div", {}, [h("div", {}, "child" + this.$props.msg)]);
  },
};
