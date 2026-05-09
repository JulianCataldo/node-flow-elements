export interface IconEntry {
	name: string;
	weight?: 'bold' | 'duotone' | 'fill' | 'light' | 'regular' | 'thin';
}

export const iconManifest: IconEntry[] = [
	// --- Headful UI ---
	{ name: 'app-window' },
	{ name: 'arrows-left-right' },
	{ name: 'bug' },
	{ name: 'chat-text' },
	{ name: 'copy' },
	{ name: 'corners-in' },
	{ name: 'folder-plus' },
	{ name: 'gear' },
	{ name: 'hash' },
	{ name: 'info' },
	{ name: 'keyboard' },
	{ name: 'lightbulb' },
	{ name: 'link' },
	{ name: 'magnifying-glass' },
	{ name: 'magnifying-glass-minus' },
	{ name: 'magnifying-glass-plus' },
	{ name: 'map-trifold' },
	{ name: 'paper-plane-tilt' },
	{ name: 'robot' },
	{ name: 'sidebar' },
	{ name: 'sliders' },
	{ name: 'terminal' },
	{ name: 'text-aa' },
	{ name: 'trash' },
	{ name: 'tree-structure' },
	{ name: 'tree-view' },
	{ name: 'wrench' },

	// --- NFE core theme ---
	{ name: 'caret-right', weight: 'fill' },
	{ name: 'check' },
	{ name: 'crosshair' },
	{ name: 'package' },
	{ name: 'pencil-simple' },
	{ name: 'pulse' },
	{ name: 'trash', weight: 'fill' },
	{ name: 'tree-structure', weight: 'fill' },
	{ name: 'x' },

	// --- NFE demo nodes (temporary, until internalized) ---
	{ name: 'broadcast' },
	{ name: 'calculator' },
	{ name: 'clipboard-text' },
	{ name: 'cube-transparent' },
	{ name: 'cursor-text' },
	{ name: 'drop-half' },
	{ name: 'note' },
	{ name: 'split-horizontal' },
];
