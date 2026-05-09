// import '@gracile/gracile/hydration-elements';
// import { createHydrationRoot } from '@gracile/gracile/hydration-full';

// createHydrationRoot();

import { registerIconLibrary } from '@awesome.me/webawesome/dist/components/icon/library.js';
// eslint-disable-next-line import-x/no-unresolved
import { icons } from 'virtual:phosphor-icons';

export function registerIcons(): void {
	// Register BEFORE any component imports so no icon ever resolves against
	// WA's built-in Font Awesome CDN or NFE's (now removed) Bootstrap CDN.
	// Icons are embedded as data URIs — zero network requests, zero blink.
	registerIconLibrary('default', {
		resolver: (name, _family, variant) => {
			const weight = variant === 'solid' ? 'regular' : variant || 'regular';
			const suffix = weight === 'regular' ? '' : `-${weight}`;
			const svg = icons.get(`${name}${suffix}`);
			if (svg) return `data:image/svg+xml,${encodeURIComponent(svg)}`;
			console.warn(`[hf] Missing icon: ${name} (weight: ${weight})`);
			return '';
		},
	});
}

registerIcons();
