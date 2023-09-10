import { createRenderer } from '@mini-vue3/runtime-core';
function createElement(type) {
	return document.createElement(type);
}

function patchProps(el, key, prevVal, nextVal) {
	const isOn = (key) => /^on[A-Z]/.test(key);
	if (isOn(key)) {
		const eventName = key.slice(2).toLocaleLowerCase();
		el.addEventListener(eventName, nextVal);
	} else {
		// case 2删除或者赋值为undefined
		if (nextVal === null || nextVal === undefined) {
			el.removeAttribute(key);
		} else {
			el.setAttribute(key, nextVal);
		}
	}
}
function insert(el, parent) {
	parent.append(el);
}
function remove(child) {
	const parent = child.parentNode;
	if (parent) {
		parent.removeChild(child);
	}
}
function setElementText(el, text) {
	el.textContent = text;
}

const renderer: any = createRenderer({
	createElement,
	patchProps,
	insert,
	remove,
	setElementText,
});

export function createApp(...args) {
	return renderer.createApp(...args);
}

export * from '@mini-vue3/runtime-core';
