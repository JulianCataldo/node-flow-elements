import { test as base, type Page } from '@playwright/test';

/**
 * Shared helpers for NFE Playwright tests.
 * All tests run against the /testbed page which loads the kitchen-sink demo.
 */

export const TESTBED_URL = '/testbed/';

// ── Selectors ────────────────────────────────────────────────────────────────

export const sel = {
	flow: 'nf-flow',
	canvas: 'nf-interactive-canvas',
	node: 'nf-node',
	handle: 'nf-handle',
	port: 'nf-port',
	links: 'nf-links',
	linkPath: 'nf-links svg path',
	background: 'nf-background',
	minimap: 'nf-wa-minimap',
	navigation: 'nf-wa-navigation',
	center: 'nf-wa-center',
	inventory: 'nf-wa-inventory',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the flow to be fully loaded with nodes rendered. */
export async function waitForFlow(page: Page) {
	await page.locator('demo-nf-wa').waitFor({ state: 'attached' });
	// demo-nf-wa has `display: contents` so it has zero bounding box.
	// Scroll its inner .wrapper div into view via evaluate.
	await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa');
		const wrapper = demo?.shadowRoot?.querySelector('.wrapper');
		wrapper?.scrollIntoView({ block: 'start' });
	});
	await page.locator(sel.node).first().waitFor({ state: 'attached' });
	// Move all nodes so they have positive coordinates within the visible canvas.
	// Some nodes have negative y/x which puts them above/left of the canvas,
	// overlapping page chrome. Shift node positions rather than panzoom offset
	// to avoid interfering with panzoom state for pan/zoom tests.
	await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const flow = demo.flow;
		if (!flow?.nodes?.list?.length) return;
		const minY = Math.min(...flow.nodes.list.map((n: any) => n.y));
		const minX = Math.min(...flow.nodes.list.map((n: any) => n.x));
		const padY = minY < 50 ? -(minY - 50) : 0;
		const padX = minX < 50 ? -(minX - 50) : 0;
		if (padX || padY) {
			for (const node of flow.nodes.list) {
				node.updatePosition({ x: node.x + padX, y: node.y + padY });
			}
		}
	});
	// Give signals & panzoom a tick to settle
	await page.waitForTimeout(600);
}

/** Get the flow store from the page via evaluate. */
export function getFlowState(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		if (!demo?.flow) throw new Error('Flow not found on demo-nf-wa');
		const flow = demo.flow;
		return {
			nodeCount: flow.nodes.list.length,
			scale: flow.canvas.scale,
			offsetX: flow.canvas.offsetX,
			offsetY: flow.canvas.offsetY,
			isDraggingCanvas: flow.canvas.isDragging,
			isDraggingNode: flow.nodes.isDraggingAny,
			selectedNodeId: flow.nodes.selectedNode?.id ?? null,
			linkCount: flow.links.list.length,
			connectingLink: flow.links.connecting,
		};
	});
}

/** Get serialized flow JSON from the page. */
export function getFlowJSON(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		return demo?.flow?.toJSON();
	});
}

/** Get bounding box center of an element. */
export async function getCenter(page: Page, selector: string, nth = 0) {
	const box = await page.locator(selector).nth(nth).boundingBox();
	if (!box) throw new Error(`Element "${selector}" [${nth}] not visible`);
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Get the bounding box of the canvas area (the panzoom wrapper).
 * Uses `nf-interactive-canvas` which is reliably unique.
 */
export async function getCanvasBox(page: Page) {
	const box = await page.locator(sel.canvas).boundingBox();
	if (!box) throw new Error('Canvas element not visible');
	return box;
}

/**
 * Check a class on the panzoom wrapper inside nf-interactive-canvas shadow DOM.
 */
export function canvasWrapperHasClass(page: Page, className: string) {
	return page.evaluate((cls) => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const flow = demo?.shadowRoot?.querySelector('nf-flow');
		const canvas = flow?.shadowRoot?.querySelector('nf-interactive-canvas');
		const wrapper = canvas?.shadowRoot?.querySelector('.wrapper');
		return wrapper?.classList.contains(cls) ?? false;
	}, className);
}

/** Perform a drag gesture from (x1,y1) to (x2,y2) with configurable steps. */
export async function drag(
	page: Page,
	from: { x: number; y: number },
	to: { x: number; y: number },
	steps = 10,
) {
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	// Intermediate steps for smooth drag
	for (let i = 1; i <= steps; i++) {
		const ratio = i / steps;
		await page.mouse.move(
			from.x + (to.x - from.x) * ratio,
			from.y + (to.y - from.y) * ratio,
		);
	}
	await page.mouse.up();
}

/**
 * Get link SVG path count from within the nf-links shadow DOM.
 */
export function getLinkPathCount(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const links = demo?.shadowRoot?.querySelector('nf-links');
		const svg = links?.shadowRoot?.querySelector('svg');
		return svg?.querySelectorAll('path')?.length ?? 0;
	});
}

/**
 * Get link group (g.paths) count from within the nf-links shadow DOM.
 */
export function getLinkGroupCount(page: Page) {
	return page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const links = demo?.shadowRoot?.querySelector('nf-links');
		const svg = links?.shadowRoot?.querySelector('svg');
		return svg?.querySelectorAll('g.paths')?.length ?? 0;
	});
}

// ── Test fixture ─────────────────────────────────────────────────────────────

export const test = base.extend<{ testbedPage: Page }>({
	testbedPage: async ({ page }, use) => {
		await page.goto(TESTBED_URL);
		await waitForFlow(page);
		await use(page);
	},
});

export { expect } from '@playwright/test';
