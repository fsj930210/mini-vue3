// | 运算可以修改 , & 运算可以查找
// 提升一些性能，可读性不是很高
export const enum shapeFlags {
	ELEMENT = 1, // 0001
	STATEFUL_COMPONENT = 1 << 1, // 0010
	TEXT_CHILDREN = 1 << 2, // 0100
	ARRAY_CHILREN = 1 << 3, // 1000
	SLOT_CHILDREN = 1 << 4, // 10000
}
