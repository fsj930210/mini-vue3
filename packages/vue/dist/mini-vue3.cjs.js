'use strict';

var shapeFlags;
(function (shapeFlags) {
    shapeFlags[shapeFlags["ELEMENT"] = 1] = "ELEMENT";
    shapeFlags[shapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    shapeFlags[shapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    shapeFlags[shapeFlags["ARRAY_CHILREN"] = 8] = "ARRAY_CHILREN";
    shapeFlags[shapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(shapeFlags || (shapeFlags = {}));

const extend = Object.assign;
function isObject(value) {
    return value !== null && typeof value === 'object';
}
function hasChanged(value, oldValue) {
    return !Object.is(value, oldValue);
}
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
function toHandlerKey(str) {
    return str ? `on${capitalize(str)}` : ``;
}
const camelizeRE = /-(\w)/g;
function camelize(str) {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
}
const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase();
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function createDep(effects) {
    const dep = new Set(effects);
    return dep;
}

const targetMap = new WeakMap();
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    triggerEffects(deps);
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive") {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly") {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, newValue) {
        const res = Reflect.set(target, key, newValue);
        trigger(target, key);
        return res;
    };
}
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    }
};
const mutableHandlers = {
    get,
    set,
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));
function createReactiveObject(raw, baseHandler) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
    }
    return new Proxy(raw, baseHandler);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function emit(instance, eventName, ...restArgs) {
    const { props } = instance;
    let handler = props[toHandlerKey(camelize(eventName))];
    if (!handler) {
        handler = props[toHandlerKey(hyphenate(eventName))];
    }
    if (handler) {
        handler(...restArgs);
    }
}

function initSlots(instance, chilrdren) {
    const { vnode } = instance;
    if (16 & vnode.shapeFlag) {
        normalizeObjectSlots(chilrdren, instance.slots);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8;
    }
    if (vnode.shapeFlag & 2) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16;
        }
    }
    return vnode;
}
function createTextNode(text) {
    const vnode = createVNode(Text, {}, text);
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 : 2;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragement(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 2) {
                processComponent(vnode, container);
            }
            else if (shapeFlag & 1) {
                processElement(vnode, container);
            }
            break;
    }
}
function processText(vnode, container) {
    const textNode = (vnode.el = document.createTextNode(vnode.children));
    container.appendChild(textNode);
}
function processFragement(vnode, container) {
    mountChildren(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    initialVnode.el = subTree.el;
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    const isOn = (key) => /^on[A-Z]/.test(key);
    for (const prop in props) {
        const val = props[prop];
        if (isOn(prop)) {
            const eventName = prop.slice(2).toLocaleLowerCase();
            el.addEventListener(eventName, val);
        }
        else {
            el.setAttribute(prop, val);
        }
    }
    if (shapeFlag & 4) {
        el.textContent = children;
    }
    else if (shapeFlag & 8) {
        mountChildren(vnode, el);
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    const vnode = createVNode(type, props, children);
    return vnode;
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
        return createVNode(Fragment, {}, slot(props));
    }
}

class RefImpl {
    constructor(_value) {
        this.__v_isRef = true;
        this._rawValue = _value;
        this._value = convert(_value);
        this.dep = createDep();
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerRefValue(this);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
function ref(value) {
    const refImpl = new RefImpl(value);
    return refImpl;
}

exports.createApp = createApp;
exports.createTextNode = createTextNode;
exports.h = h;
exports.ref = ref;
exports.renderSlots = renderSlots;
//# sourceMappingURL=mini-vue3.cjs.js.map
