declare module 'jsx-forge/jsx-runtime' {
	export namespace JSX {
		interface BaseHTMLElement extends HTMLElement {}

		type MappedCustomElements<CustomElements, _BaseElement> = {
			[K in keyof CustomElements]?: unknown;
		};

		interface IntrinsicElements {
			[tagName: string]: Record<string, unknown>;
		}
	}
}

export {};
