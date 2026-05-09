import type { Plugin } from 'vite';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IconEntry } from './icon-manifest.js';

const VIRTUAL_ID = 'virtual:phosphor-icons';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

export function phosphorIconsPlugin(icons: IconEntry[]): Plugin {
	function buildIconMap(): Map<string, string> {
		const map = new Map<string, string>();
		for (const { name, weight = 'regular' } of icons) {
			const suffix = weight === 'regular' ? '' : `-${weight}`;
			const id = `${name}${suffix}`;
			const svgPath = resolve(
				'node_modules/@phosphor-icons/core/assets',
				weight,
				`${id}.svg`,
			);

			try {
				map.set(id, readFileSync(svgPath, 'utf-8'));
			} catch {
				throw new Error(
					`[phosphor-icons] Missing SVG: ${svgPath} (icon: "${name}", weight: "${weight}")`,
				);
			}
		}
		return map;
	}

	return {
		load(id) {
			if (id !== RESOLVED_ID) return;
			const map = buildIconMap();
			const entries = [...map.entries()].map(
				([k, v]) => `[${JSON.stringify(k)},${JSON.stringify(v)}]`,
			);
			return `export const icons = new Map([${entries.join(',')}]);`;
		},

		name: 'vite-plugin-phosphor-icons',

		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
	};
}
