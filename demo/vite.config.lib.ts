// NOTE: OLD. Kept for reference
// import { defineConfig } from 'vite';
// import dts from 'vite-plugin-dts';
// import autoExternal from 'rollup-plugin-auto-external';
// import { literalsHtmlCssMinifier } from '@literals/rollup-plugin-html-css-minifier';

// import * as common from './vite.common.js';

// export default defineConfig(({ mode }) => {
// 	console.log("'Mode", mode);
// 	return {
// 		resolve: common.resolve,

// 		esbuild: { jsx: 'preserve' },

// 		build: {
// 			lib: {
// 				entry: [
// 					'./src/lib/index.ts',
// 					'./src/lib/themes/webawesome/index.ts',
// 					'./src/lib/themes/webawesome/demo-nodes/index.ts',
// 					'./src/lib/adapters/react.ts',
// 					// './src/lib/adapters/vue.ts',
// 				],
// 				name: 'NodeFlowElements',
// 				formats: ['es'],
// 			},

// 			target: 'esnext',
// 			sourcemap: true,

// 			minify: false,

// 			rollupOptions: {
// 				output: { preserveModules: true, preserveModulesRoot: 'src/lib' },

// 				// NOTE: Needed because `auto-external` will not catch everything.
// 				external: [
// 					/^@awesome\.me\/webawesome\//,
// 					/^@shoelace-style\/shoelace\//,

// 					'clsx',
// 					'signal-polyfill',
// 					'signal-utils/subtle/reaction',
// 					'jsx-forge/components/for',

// 					'lit/directives/ref.js',
// 					'lit/decorators.js',
// 					'lit/directives/unsafe-html.js',
// 					'lit/directives/class-map.js',
// 					'lit/directives/style-map.js',
// 					'@lit-labs/signals',
// 					'@lit-labs/motion',
// 					'@lit/context',
// 					'lit/directives/repeat.js',

// 					// TODO: Use regex
// 					// external: [/^lit\/.*/],

// 					'react',
// 					'vue',
// 				],

// 				plugins: [autoExternal()],
// 			},
// 		},

// 		plugins: [
// 			dts({ entryRoot: './src/lib' }),

// 			common.staticCopy(mode),
// 			common.jsxToLiteralsConfig,
// 			literalsHtmlCssMinifier(),
// 		],
// 	};
// });
