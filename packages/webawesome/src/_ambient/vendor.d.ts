import type { CustomElementsLocal as NfeCustomElements } from '@node-flow-elements/core/web-elements';
import type {} from '@awesome.me/webawesome/dist/events/events.js';
// import type { CustomElementsLocal as JsfeCustomElements } from '@jsfe/webawesome/web-elements';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VendorCustomElements
	extends NfeCustomElements /* , JsfeCustomElements */ {}

declare module 'jsx-forge/jsx-runtime' {
	namespace JSX {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface IntrinsicElements
			extends JSX.MappedCustomElements<
				VendorCustomElements,
				JSX.BaseHTMLElement
			> {}
	}
}
