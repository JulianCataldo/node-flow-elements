import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173/testbed/');
await page.waitForSelector('nf-flow', { state: 'attached' });
await page.waitForSelector('nf-node', { state: 'attached' });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
	const flow = document.querySelector('nf-flow');
	const canvas = document.querySelector('nf-interactive-canvas');
	const nodes = document.querySelectorAll('nf-node');
	const handles = document.querySelectorAll('nf-handle');
	const ports = document.querySelectorAll('nf-port');
	const links = document.querySelector('nf-links');
	const bg = document.querySelector('nf-background');

	const flowShadow = flow?.shadowRoot !== null;
	const canvasShadow = canvas?.shadowRoot !== null;
	const nodeShadow = nodes[0]?.shadowRoot !== null;

	const canvasChildren = canvas
		? Array.from(canvas.children).map(
				(c) => `<${c.tagName.toLowerCase()} class="${c.className}">`,
			)
		: [];
	const canvasShadowChildren = canvas?.shadowRoot
		? Array.from(canvas.shadowRoot.children).map(
				(c) => `<${c.tagName.toLowerCase()} class="${c.className}">`,
			)
		: [];

	const allWrappers = document.querySelectorAll('.wrapper');
	const wrapperTags = Array.from(allWrappers)
		.slice(0, 15)
		.map((w) => `<${w.tagName.toLowerCase()} class="${w.className}">`);

	const linksSvg = links?.querySelector('svg');
	const linksInShadow = links?.shadowRoot?.querySelector('svg');
	const linksPaths = links?.querySelectorAll('svg path');
	const linksPathsInShadow = links?.shadowRoot?.querySelectorAll('svg path');

	const flowHTML = flow?.innerHTML?.slice(0, 800);
	const flowShadowHTML = flow?.shadowRoot?.innerHTML?.slice(0, 800);

	const firstNode = nodes[0];
	const handleInNode = firstNode?.querySelector('nf-handle');
	const handleInShadow = firstNode?.shadowRoot?.querySelector('nf-handle');

	// Check if nodes have handles via querySelectorAll
	const nodesWithHandles = Array.from(nodes).filter(
		(n) =>
			n.querySelector('nf-handle') || n.shadowRoot?.querySelector('nf-handle'),
	).length;
	const nodesWithPorts = Array.from(nodes).filter(
		(n) => n.querySelector('nf-port') || n.shadowRoot?.querySelector('nf-port'),
	).length;

	return {
		flowExists: !!flow,
		canvasExists: !!canvas,
		nodeCount: nodes.length,
		handleCount: handles.length,
		portCount: ports.length,
		linksExists: !!links,
		bgExists: !!bg,
		flowShadow,
		canvasShadow,
		nodeShadow,
		canvasChildren,
		canvasShadowChildren,
		wrapperTags,
		linksSvgExists: !!linksSvg,
		linksSvgInShadow: !!linksInShadow,
		linksPathCount: linksPaths?.length ?? 0,
		linksPathInShadowCount: linksPathsInShadow?.length ?? 0,
		flowHTML,
		flowShadowHTML,
		handleInNode: !!handleInNode,
		handleInShadow: !!handleInShadow,
		nodesWithHandles,
		nodesWithPorts,
	};
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
