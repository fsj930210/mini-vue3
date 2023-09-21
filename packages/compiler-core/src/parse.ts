import { NodeTypes } from './ast';

const enum TagType {
	Start,
	End,
}

export function baseParse(content: string) {
	// 1 引入context
	const context = createParserContext(content);
	// 2 抽离根节点
	return createRoot(parseChildren(context));
}

// 1 引入context
function createParserContext(content: string) {
	return {
		source: content,
	};
}
// 2 抽离根节点
function createRoot(children) {
	return {
		children,
	};
}
// 3 抽离children
function parseChildren(context) {
	const s = context.source;
	// 返回数组
	// 创建数组
	const nodes: any[] = [];
	let node;
	// 判断必须是{{开始的才解析
	if (s.startsWith('{{')) {
		node = parseInterpolation(context);
	} else if (s[0] === '<') {
		if (/[a-z]/i.test(s[1])) {
			node = parseElement(context);
		}
	}
	nodes.push(node);
	return nodes;
}
// 4 抽离插值
function parseInterpolation(context) {
	// 实现具体
	const openDelimiter = '{{';
	const closeDelimiter = '}}';
	// 结束索引
	const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
	// 往前推进
	advanceBy(context, openDelimiter.length);
	// 计算插值长度
	const rawContentLength = closeIndex - openDelimiter.length;
	// 拿到插值
	const rawContent = context.source.slice(0, rawContentLength);
	// 去除空格
	const content = rawContent.trim();
	// 删除插值后面的内容
	advanceBy(context, rawContentLength + closeDelimiter.length);
	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content,
		},
	};
}
function advanceBy(context, length) {
	context.source = context.source.slice(length);
}

function parseElement(context) {
	// 1 解析tag
	const element = parseTag(context, TagType.Start);
	// 2 删除处理完成的代码
	parseTag(context, TagType.End);
	return element;
}
function parseTag(context, type) {
	const match: any = /^<\/?([a-z]+)/i.exec(context.source);
	const tag = match[1];
	advanceBy(context, match[0].length);
	advanceBy(context, 1);
	if (type === TagType.End) return;
	return {
		type: NodeTypes.ELEMENT,
		tag,
	};
}
