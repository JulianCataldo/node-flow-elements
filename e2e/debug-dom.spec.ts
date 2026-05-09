import { test, expect } from '@playwright/test';

test('debug drag mechanics', async ({ page }) => {
	await page.goto('http://localhost:5173/testbed/');
	await page.waitForTimeout(2000);

	// 1. Check handle bounding box
	const handle = page.locator('nf-handle').first();
	const hBox = await handle.boundingBox();
	console.log('Handle bbox:', JSON.stringify(hBox));

	// 2. Try using the visual element inside the handle instead
	const title = page.locator('nf-wa-node .title').first();
	const tBox = await title.boundingBox();
	console.log('Title bbox:', JSON.stringify(tBox));

	// 3. Node before
	const before = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const n = demo.flow.nodes.list[0];
		return { x: n.x, y: n.y, isDragging: n.isDragging };
	});
	console.log('Before:', JSON.stringify(before));

	// 4. Register event listeners to debug
	await page.evaluate(() => {
		(window as any).__debugEvents = [];
		// Document-level capture to see ALL pointerdowns
		document.addEventListener(
			'pointerdown',
			(e: any) => {
				(window as any).__debugEvents.push({
					type: 'DOC-pointerdown',
					target: e.target?.tagName,
					composedPathTags: e
						.composedPath()
						.slice(0, 20)
						.map((el: any) => el.tagName?.toLowerCase() || el.toString?.()),
				});
			},
			true,
		); // capture phase!

		const demo = document.querySelector('demo-nf-wa') as any;
		const flow = demo.shadowRoot.querySelector('nf-flow');
		const canvas = flow.shadowRoot.querySelector('nf-interactive-canvas');
		const wrapper = canvas.shadowRoot.querySelector('.wrapper');

		// Capture phase on wrapper
		wrapper.addEventListener(
			'pointerdown',
			(e: any) => {
				(window as any).__debugEvents.push({
					type: 'WRAPPER-pointerdown-capture',
					target: e.target?.tagName,
				});
			},
			true,
		);

		// Bubble phase on wrapper
		wrapper.addEventListener('pointerdown', (e: any) => {
			(window as any).__debugEvents.push({
				type: 'WRAPPER-pointerdown-bubble',
				target: e.target?.tagName,
				composedPathTags: e
					.composedPath()
					.slice(0, 15)
					.map((el: any) => el.tagName?.toLowerCase() || el.toString?.()),
				hasNode: e
					.composedPath()
					.some((el: any) => el.tagName?.toLowerCase() === 'nf-node'),
				hasHandle: e
					.composedPath()
					.some((el: any) => el.tagName?.toLowerCase() === 'nf-handle'),
			});
		});

		wrapper.addEventListener('pointermove', (e: any) => {
			if ((window as any).__debugEvents.length < 25) {
				(window as any).__debugEvents.push({
					type: 'pointermove',
					target: e.target?.tagName,
				});
			}
		});
		wrapper.addEventListener('pointerup', (e: any) => {
			(window as any).__debugEvents.push({
				type: 'pointerup',
				target: e.target?.tagName,
			});
		});
	});

	// 5. Do the drag using handle bounding box
	if (hBox) {
		const cx = hBox.x + hBox.width / 2;
		const cy = hBox.y + hBox.height / 2;
		console.log('Dragging from:', cx, cy, 'to:', cx + 150, cy + 100);

		await page.mouse.move(cx, cy);
		await page.mouse.down();
		for (let i = 1; i <= 10; i++) {
			await page.mouse.move(cx + 15 * i, cy + 10 * i);
		}
		await page.mouse.up();
	}

	await page.waitForTimeout(300);

	// 6. Node after
	const after = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const n = demo.flow.nodes.list[0];
		return { x: n.x, y: n.y, isDragging: n.isDragging };
	});
	console.log('After:', JSON.stringify(after));

	// 7. Events captured
	const events = await page.evaluate(() => (window as any).__debugEvents);
	console.log('Events:', JSON.stringify(events, null, 2));

	// 8. Also try drag using title bounding box
	if (tBox) {
		const cx = tBox.x + tBox.width / 2;
		const cy = tBox.y + tBox.height / 2;
		console.log('Dragging from title:', cx, cy);

		await page.mouse.move(cx, cy);
		await page.mouse.down();
		for (let i = 1; i <= 10; i++) {
			await page.mouse.move(cx + 15 * i, cy + 10 * i);
		}
		await page.mouse.up();
	}

	await page.waitForTimeout(300);

	const after2 = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa') as any;
		const n = demo.flow.nodes.list[0];
		return { x: n.x, y: n.y };
	});
	console.log('After title drag:', JSON.stringify(after2));
});

test('debug dom - shadow hierarchy', async ({ page }) => {
	await page.goto('http://localhost:5173/testbed/');
	await page.waitForTimeout(3000);

	// Playwright locators pierce shadow DOM automatically
	const demoCount = await page.locator('demo-nf-wa').count();
	const flowCount = await page.locator('nf-flow').count();
	const canvasCount = await page.locator('nf-interactive-canvas').count();
	const nodeCount = await page.locator('nf-node').count();
	const handleCount = await page.locator('nf-handle').count();
	const portCount = await page.locator('nf-port').count();
	const linksCount = await page.locator('nf-links').count();
	const bgCount = await page.locator('nf-background').count();
	const minimapCount = await page.locator('nf-wa-minimap').count();
	const navCount = await page.locator('nf-wa-navigation').count();
	const centerCount = await page.locator('nf-wa-center').count();
	const invCount = await page.locator('nf-wa-inventory').count();

	console.log(
		JSON.stringify(
			{
				demoCount,
				flowCount,
				canvasCount,
				nodeCount,
				handleCount,
				portCount,
				linksCount,
				bgCount,
				minimapCount,
				navCount,
				centerCount,
				invCount,
			},
			null,
			2,
		),
	);

	// Check shadow DOM structure by evaluating inside
	const shadowInfo = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa');
		const demoSR = demo?.shadowRoot;
		const demoChildren = demoSR
			? Array.from(demoSR.querySelectorAll('*'))
					.slice(0, 10)
					.map((e) => e.tagName.toLowerCase())
			: [];

		const flow = demoSR?.querySelector('nf-flow');
		const flowSR = flow?.shadowRoot;
		const flowChildren = flowSR
			? Array.from(flowSR.querySelectorAll('*'))
					.slice(0, 10)
					.map((e) => e.tagName.toLowerCase())
			: [];

		const canvas = flowSR?.querySelector('nf-interactive-canvas');
		const canvasSR = canvas?.shadowRoot;
		const canvasChildren = canvasSR
			? Array.from(canvasSR.querySelectorAll('*'))
					.slice(0, 10)
					.map((e) => e.tagName.toLowerCase())
			: [];

		// Light DOM children of flow (slotted)
		const flowLightChildren = flow
			? Array.from(flow.children).map(
					(e) =>
						e.tagName.toLowerCase() +
						(e.getAttribute('slot') ? `[slot=${e.getAttribute('slot')}]` : ''),
				)
			: [];

		// Nodes — where do they live?
		const nodesInFlowSR = flowSR?.querySelectorAll('nf-node');
		const nodesInFlowLight = flow?.querySelectorAll('nf-node');
		const nodesInCanvasSR = canvasSR?.querySelectorAll('nf-node');

		// First node structure
		const firstNode = nodesInFlowSR?.[0] || nodesInCanvasSR?.[0];
		const nodeSR = firstNode?.shadowRoot;
		const nodeChildren = firstNode
			? Array.from(firstNode.children).map((e) => e.tagName.toLowerCase())
			: [];
		const nodeSRChildren = nodeSR
			? Array.from(nodeSR.querySelectorAll('*'))
					.slice(0, 10)
					.map((e) => e.tagName.toLowerCase())
			: [];

		// Flow instance access
		const flowEl = flow as any;
		const hasFlowProp = !!flowEl?.flow;
		const demoEl = demo as any;
		const hasFlowOnDemo = !!demoEl?.flow;

		return {
			demoShadowExists: !!demoSR,
			demoChildren,
			flowExists: !!flow,
			flowShadowExists: !!flowSR,
			flowChildren,
			flowLightChildren,
			canvasExists: !!canvas,
			canvasShadowExists: !!canvasSR,
			canvasChildren,
			nodesInFlowSR: nodesInFlowSR?.length ?? 0,
			nodesInFlowLight: nodesInFlowLight?.length ?? 0,
			nodesInCanvasSR: nodesInCanvasSR?.length ?? 0,
			nodeChildren,
			nodeSRChildren,
			hasFlowProp,
			hasFlowOnDemo,
		};
	});
	console.log(JSON.stringify(shadowInfo, null, 2));

	// Check first node positioning
	const nodePosInfo = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa');
		const flow = demo?.shadowRoot?.querySelector('nf-flow');
		const canvas = flow?.shadowRoot?.querySelector('nf-interactive-canvas');
		const canvasSR = canvas?.shadowRoot;

		// Try to find nodes at various levels
		const allNfNodes = [
			...Array.from(flow?.shadowRoot?.querySelectorAll('nf-node') ?? []),
			...Array.from(canvasSR?.querySelectorAll('nf-node') ?? []),
		];

		if (allNfNodes.length === 0)
			return { msg: 'No nf-node found in shadow DOM' };

		const first = allNfNodes[0] as HTMLElement;
		const style = first.getAttribute('style');
		const cs = getComputedStyle(first);
		const dx = cs.getPropertyValue('--dx');
		const dy = cs.getPropertyValue('--dy');
		const slotName = first.querySelector('slot')?.getAttribute('name');
		const tag = first.tagName.toLowerCase();

		return { tag, style, dx, dy, slotName, childCount: first.children.length };
	});
	console.log('Node position:', JSON.stringify(nodePosInfo, null, 2));

	// Check SVG links structure
	const linksInfo = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa');
		const flow = demo?.shadowRoot?.querySelector('nf-flow');
		const links =
			flow?.querySelector('nf-links') ||
			demo?.shadowRoot?.querySelector('nf-links');
		const linksSR = links?.shadowRoot;
		const svg = linksSR?.querySelector('svg') || links?.querySelector('svg');
		const paths = svg?.querySelectorAll('path');
		return {
			linksFound: !!links,
			linksShadow: !!linksSR,
			svgFound: !!svg,
			pathCount: paths?.length ?? 0,
			svgInLight: !!links?.querySelector('svg'),
			svgInShadow: !!linksSR?.querySelector('svg'),
		};
	});
	console.log('Links:', JSON.stringify(linksInfo, null, 2));

	// Check port structure
	const portInfo = await page.evaluate(() => {
		const demo = document.querySelector('demo-nf-wa');
		const flow = demo?.shadowRoot?.querySelector('nf-flow');
		const flowSR = flow?.shadowRoot;

		// Deep search for ports
		function deepFindAll(
			root: Element | ShadowRoot | null | undefined,
			tag: string,
		): Element[] {
			if (!root) return [];
			const found: Element[] = [];
			const children =
				root instanceof ShadowRoot
					? Array.from(root.querySelectorAll('*'))
					: Array.from(root.querySelectorAll('*'));
			for (const child of children) {
				if (child.tagName.toLowerCase() === tag) found.push(child);
				if (child.shadowRoot) found.push(...deepFindAll(child.shadowRoot, tag));
			}
			return found;
		}

		const allPorts = deepFindAll(demo?.shadowRoot ?? null, 'nf-port');
		const allHandles = deepFindAll(demo?.shadowRoot ?? null, 'nf-handle');
		const allNodes = deepFindAll(demo?.shadowRoot ?? null, 'nf-node');

		const firstPort = allPorts[0] as HTMLElement | undefined;
		const portSR = firstPort?.shadowRoot;
		const portSRHTML = portSR?.innerHTML?.slice(0, 300);

		return {
			allPorts: allPorts.length,
			allHandles: allHandles.length,
			allNodes: allNodes.length,
			portSRExists: !!portSR,
			portSRHTML,
		};
	});
	console.log('Ports:', JSON.stringify(portInfo, null, 2));
});
