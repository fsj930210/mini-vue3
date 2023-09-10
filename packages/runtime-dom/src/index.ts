import { createRenderer } from '@mini-vue3/runtime-core';
function createElement(type) {
	return document.createElement(type);
}

function patchProps(el, key, val) {
	const isOn = (key) => /^on[A-Z]/.test(key);
	if (isOn(key)) {
		const eventName = key.slice(2).toLocaleLowerCase();
		el.addEventListener(eventName, val);
	} else {
		el.setAttribute(key, val);
	}
}
function insert(el, parent) {
	parent.append(el);
}

const renderer: any = createRenderer({
	createElement,
	patchProps,
	insert,
});

export function createApp(...args) {
	return renderer.createApp(...args);
}

export * from '@mini-vue3/runtime-core';
