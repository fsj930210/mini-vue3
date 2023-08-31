import typescript from '@rollup/plugin-typescript';

export default {
	input: './packages/vue/src/index.ts',
	output: [
		{
			format: 'cjs',
			file: './packages/vue/dist/mini-vue3.cjs.js',
			sourcemap: true,
		},
		{
			name: 'vue',
			format: 'es',
			file: './packages/vue/dist/mini-vue3.esm.js',
			sourcemap: true,
		},
	],
	plugins: [typescript()],
};
