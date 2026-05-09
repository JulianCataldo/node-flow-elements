import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import importX from 'eslint-plugin-import-x';

const config = [
	{
		ignores: [
			'coverage',
			'dist',
			'demo/dist-site',
			'**/.dev',
			'packages/**/dist',
			'.gracile',
			'.external-repos',
			'node_modules',
			'packages/**/node_modules',
			'packages/core/src/_ambient',
			'packages/core/src/features/pocs',
			'packages/core/src/_pocs',
			'**/web-elements*.d.ts',
			'**/coverage',
			'packages/core/types',
			'playwright.config.ts',
			'packages/core/test-d',
			'packages/core/src/test',
			'e2e',
			'eslint.config.js',
			'demo/vite*',
			'demo/src/types',
			'**/public/api',
			'./.local-paths.cjs',
			'./.pnpmfile.cjs',
		],
	},
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
	},

	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },

	{
		languageOptions: {
			parserOptions: {
				project: [
					'./tsconfig.json',
					'./packages/core/tsconfig.json',
					'./packages/webawesome/tsconfig.json',
					'./demo/tsconfig.json',
				],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	pluginJs.configs.recommended,
	...tseslint.configs.recommended,

	eslintPluginUnicorn.configs['flat/all'],

	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		rules: {
			'import-x/no-unresolved': ['error', { ignore: ['^gracile:'] }],
			'import-x/order': [
				'error',
				{
					'newlines-between': 'always',
					distinctGroup: false,
				},
			],
		},
	},

	{
		rules: {
			'max-lines': ['error', { max: 300 }],
			'no-console': 'warn',
			'unicorn/no-null': 'off',
			'unicorn/template-indent': 'off',

			'class-methods-use-this': 'warn',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-extraneous-class': 'error',
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/require-await': 'error',

			'unicorn/no-array-sort': 'off',
			'unicorn/require-module-specifiers': 'off',
			'unicorn/prevent-abbreviations': ['error', { ignore: ['e2e', 'el'] }],

			// dataset breaks Lit SSR (undefined on server)
			'unicorn/prefer-dom-node-dataset': 'off',
		},
	},

	{
		// files: ['*'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowExpressions: true,
					allowTypedFunctionExpressions: true,
				},
			],
		},
	},

	// Relax rules for tests
	{
		files: ['**/*.test.*', 'tests/**'],
		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
			'@typescript-eslint/require-await': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': 'off',
		},
	},

	// Files outside declared TS projects should still lint (without type-aware rules)
	{
		files: ['demo/vite*.ts', 'eslint.config.js'],
		languageOptions: {
			parserOptions: {
				project: false,
			},
		},
	},
];

export default config;
