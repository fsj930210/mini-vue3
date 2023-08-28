import { extend } from '@mini-vue3/shared';

const targetMap = new WeakMap();
let activeEffect;
let shouldTrack;
class ReactiveEffect {
	active = true;
	deps = [];
	public onStop?: () => void;
	constructor(public _fn: Function, public scheduler?: Function) {
		console.log('创建 ReactiveEffect 对象');
	}
	run() {
		if (!this.active) {
			return this._fn();
		}
		shouldTrack = true;
		activeEffect = this;
		const res = this._fn();
		// reset
		shouldTrack = false;
		return res;
	}
	stop() {
		if (this.active) {
			// 性能优化多次调用
			// 如果第一次执行 stop 后 active 就 false 了
			// 这是为了防止重复的调用，执行 stop 逻辑
			cleanupEffect(this);
			this.onStop?.();
			this.active = false;
		}
	}
}

function cleanupEffect(effect) {
	// 找到所有依赖这个 effect 的响应式对象
	// 从这些响应式对象里面把 effect 给删除掉
	effect.deps.forEach((dep: any) => {
		dep.delete(effect);
	});
	effect.deps.length = 0;
}

export function isTracking() {
	return shouldTrack && activeEffect !== undefined;
}
export function effect(fn, options: any = {}) {
	const _effect = new ReactiveEffect(fn);
	// 把用户传过来的值合并到 _effect 对象上去
	// 缺点就是不是显式的，看代码的时候并不知道有什么值
	extend(_effect, options);
	_effect.run();
	const runner: any = _effect.run.bind(_effect);
	runner.effect = _effect;
	return runner;
}
// 提取依赖收集，在ref中也会用到
export function trackEffects(dep) {
	// 这里是一个优化点
	// 先看看这个依赖是不是已经收集了，
	// 已经收集的话，那么就不需要在收集一次了
	// 可能会影响 code path change 的情况
	// 需要每次都 cleanupEffect
	if (!dep.has(activeEffect)) {
		dep.add(activeEffect);
		// 反向存储用于stop
		activeEffect.deps.push(dep);
	}
}
export function track(target, key) {
	// 只有在依赖收集时才进行
	if (!isTracking()) return;
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
		depsMap.set(key, dep);
	}
	trackEffects(dep);
}
// 提取触发依赖， ref中会使用
export function triggerEffects(dep) {
	// 执行收集到的所有的 effect 的 run 方法
	for (const effect of dep) {
		if (effect.scheduler) {
			// scheduler 可以让用户自己选择调用的时机
			// 这样就可以灵活的控制调用了
			// 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
			effect.scheduler();
		} else {
			effect.run();
		}
	}
}
export function trigger(target, key) {
	const depsMap = targetMap.get(target);
	const deps = depsMap.get(key);
	triggerEffects(deps);
}

export function stop(runner) {
	runner.effect.stop();
}
