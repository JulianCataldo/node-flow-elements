// NOTE: Not working for now, keeping it to fix it somehow.

import { defineRoute } from '@gracile/gracile/route';

import { document } from '../document.js';

const title = 'Custom Elements';
export default defineRoute({
	document: () => document({ title }),

	template: () => (
		<div class="root">
			{/* <SideMenu toc={elements.meta.tableOfContents} title={title} /> */}

			<main class="main">{/* <article $:html={elements.body.html} /> */}</main>
			{/* <wc-dox tag="nf-flow"></wc-dox> */}
			{/* <wc-dox tag="nf-flow"></wc-dox> */}

			{/* <wc-dox component-name="NfBackgroundElement"></wc-dox> */}

			{/* <wc-css-parts tag="my-element"></wc-css-parts> */}
		</div>
	),
});
