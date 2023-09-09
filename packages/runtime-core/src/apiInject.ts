import { getCurrentInstance } from './component';

export function provide(key, val) {
	const instance: any = getCurrentInstance();
	if (instance) {
		const { provides } = instance;
		provides[key] = val;
	}
}

export function inject(key) {
	const instance: any = getCurrentInstance();
	if (instance) {
		const { parent } = instance;
		return parent.provides[key];
	}
}
