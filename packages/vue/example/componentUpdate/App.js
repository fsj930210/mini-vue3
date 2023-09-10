// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from "../../dist/mini-vue3.esm.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {
    const count  = ref(1);
    const msg = ref("123");
    window.msg = msg

    const changeChildProps = () => {
      msg.value = "456";
    };
    const changeCount = () => {
      count.value ++;
    }
    return { 
      msg, 
      count,
      changeChildProps,
      changeCount,
     };
  },

  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "change child props"
      ),
      h(Child, {
        msg: this.msg,
      }),
      h("div", {}, "count" + this.count),
      h(
        "button",
        {
          onClick: this.changeCount,
        },
        "change count"
      ),
    ]);
  },
};
