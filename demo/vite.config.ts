import { defineConfig } from 'vite';
import { literalsHtmlCssMinifier } from '@literals/rollup-plugin-html-css-minifier';
import { gracile } from '@gracile/gracile/plugin';
// import { litShikiLanguages } from '@gracile/doc/lib/markdown/tm-grammars/lit.js';
import { type ShikiTransformer } from 'shiki';
import { phosphorIconsPlugin } from './vite/vite-plugin-icon-sprite.js';
import { litMacros } from '@gracile-labs/lit-macros/vite';

import { standardCssModules } from 'vite-plugin-standard-css-modules';
// import {
//   transformerNotationDiff,
//   transformerNotationHighlight,
//   transformerNotationWordHighlight,
//   transformerNotationFocus,
//   transformerNotationErrorLevel,
//   transformerMetaHighlight,
//   transformerMetaWordHighlight,
// } from '@shikijs/transformers';
import terser from '@rollup/plugin-terser';

// import { viteMarkdownPlugin } from '@gracile/markdown/vite';
// import { MarkdownRenderer } from '@gracile/markdown-preset-marked';

import * as common from './vite.common.js';
import { iconManifest } from './vite/icon-manifest.js';
// import { viteStaticCopy } from 'vite-plugin-static-copy';
// import { customElementsManifestToMarkdown } from '@custom-elements-manifest/to-markdown';
// import fs from 'fs';

// generateLitTypes(manifest, {
//   ...cemPluginDefaultOptions,
//   fileName: 'jsx-vendor.d.ts',
// });

// function generateCemDocs() {
//   const manifest = JSON.parse(
//     fs.readFileSync('./dist/custom-elements.json', 'utf-8'),
//   );
//   const markdown = customElementsManifestToMarkdown(manifest, {
//     private: 'hidden',
//     omitDeclarations: [
//       'mixins',
//       'variables',
//       'functions',
//       'exports',
//       'super-class',
//     ],
//     omitSections: ['mixins', 'super-class'],
//     // headingOffset: 0,
//     // private: 'details',
//   });

//   fs.writeFileSync('./custom-elements.md', markdown);
// }

// generateCemDocs();

export default defineConfig(async ({ mode }) => {
	return {
		server: { watch: { usePolling: false } },
		resolve: common.resolve,

		build: {
			target: 'esnext',
			sourcemap: true,
			outDir: 'dist-site',
		},

		esbuild: { jsx: 'preserve' },

		plugins: [
			// Inspect(),

			common.jsxToLiteralsConfig,
			gracile(),

			common.staticCopy(mode),
			// viteStaticCopy({
			//   targets: [
			//     {
			//       src: 'docs',
			//       dest: 'api',
			//     },
			//   ],
			// }),

			await mdConfig(),

			mode === 'production' ? terser() : null,
			mode === 'production' ? literalsHtmlCssMinifier() : null,

			// vue(),
			// react({ exclude: ['**/*.el.*'] }),
			// svelte(),
		],
	};
});

// const highlighter = await createHighlighter({
// 	langs: [
// 		'md',
// 		'js',
// 		'ts',
// 		'tsx',
// 		'vue',
// 		'sh',
// 		'css',
// 		'scss',
// 		...litShikiLanguages,
// 	],
// 	themes: ['github-dark-default'],
// });

function transformerFileNames(): ShikiTransformer {
	return {
		line(hast) {
			const comment = '// @filename: ';

			const fileNameCommentLine = hast.children.find(
				(e) =>
					e?.type === 'element' &&
					e?.children?.some(
						(e2) => e2?.type === 'text' && e2?.value?.startsWith(comment),
					),
			);
			if (fileNameCommentLine?.type === 'element') {
				const elem = fileNameCommentLine.children.at(0);

				if (elem?.type !== 'text') return;

				const value = elem.value.replace(comment, '');

				hast.tagName = 'div';
				hast.properties = { class: 'file-title' };
				hast.children = [{ type: 'text', value }];
			}
		},
	};
}

async function mdConfig() {
	// const _marked = marked
	// 	// .use({
	// 	//   walkTokens() {},
	// 	// })
	// 	.use(
	// 		markedShiki({
	// 			highlight(code, lang, props) {
	// 				// console.log(code, lang);
	// 				// return highlighter.codeToHtml(code, {
	// 				// 	lang,
	// 				// 	theme: 'github-dark-default',
	// 				// 	meta: { __raw: props.join(' ') }, // required by `transformerMeta*`
	// 				// 	transformers: [
	// 				// 		// transformerNotationDiff(),
	// 				// 		// transformerNotationHighlight(),
	// 				// 		// transformerNotationWordHighlight(),
	// 				// 		// transformerNotationFocus(),
	// 				// 		// transformerNotationErrorLevel(),
	// 				// 		// transformerMetaHighlight(),
	// 				// 		// transformerMetaWordHighlight(),
	// 				// 		transformerFileNames(),
	// 				// 	],
	// 				// });
	// 			},
	// 		}),
	// 	);

	return [
		standardCssModules({ outputMode: 'CSSResult' }),
		phosphorIconsPlugin(iconManifest),
		litMacros(),
		// viteMarkdownPlugin({
		// 	MarkdownRenderer,
		// 	// options: {
		// 	//   markedInstance: _marked,
		// 	//   collectCodeBlocks: true,
		// 	//   post(infos) {
		// 	//     // console.log({ infos });
		// 	//   },
		// 	// },
		// }),
	];
}
