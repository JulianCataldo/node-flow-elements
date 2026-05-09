import { gracileJsxToLiterals } from '@gracile-labs/vite-plugin-jsx-forge/to-literals';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export const resolve = {
	// NOTE: !!!BEWARE!!!
	// The dep. MUST be installed for its dedupe to take effect.
	// E.g., dupped `signal-polyfill` => kaboom. Split ESM graph,
	// loss of reactivity.
	dedupe: [
		'@lit/reactive-element',
		'lit',
		'lit-html',
		'lit-element',
		'@lit-labs/ssr',
		'@lit-labs/ssr-client',
		'@lit-labs/ssr-dom-shim',
		'@lit-labs/signals',
		// 'signal-polyfill',
		// 'signal-utils',
		// '@awesome.me/webawesome',
		// '@jsfe/webawesome',
	],
};

export const jsxToLiteralsConfig = gracileJsxToLiterals({
	defaultHtmlFlavor: 'signal',
});

export const staticCopy = (mode: string) =>
	viteStaticCopy({
		targets: [
			{
				src: 'node_modules/@shoelace-style/shoelace/dist/assets/icons/*.svg',
				dest: 'assets/icons',
			},
		],
	});
