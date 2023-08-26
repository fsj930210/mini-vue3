
const targetMap = new WeakMap();
let activeEffect;

class ReactiveEffect{
  private _fn: Function;
  constructor(_fn: Function) {
    this._fn = _fn
  }
  run() {
    activeEffect = this;
    this._fn()
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run()
}


export function track(target, key) {
  let depsMap = targetMap.get(target);
    // 第一次需要初始化
  if (!depsMap) {
    // 初始化 depsMap 的逻辑
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep)
  }
  dep.add(activeEffect);
}
export function trigger(target, key) {
const depsMap = targetMap.get(target);
const deps = depsMap.get(key);
  for (const effect of deps) {
    effect.run();
  }
}