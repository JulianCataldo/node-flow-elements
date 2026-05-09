/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from '@lit/context';

import type {
	FlowConstructorParameters,
	GenericFlow,
	NodeInitOf,
	NodeRegistry,
} from './types.js';
import { NodeFlowEventTarget } from './events.js';
import { autoLayout } from './helpers/auto-layout.js';
import { FlowCanvasHandler } from './flow-canvas-handler.js';
import { FlowNodeHandler } from './flow-node-handler.js';
import { FlowLinkHandler } from './flow-link-handler.js';
import { FlowGuiHandler } from './flow-gui-handler.js';

export class Flow<
	_Registry extends NodeRegistry = NodeRegistry,
> extends NodeFlowEventTarget {
	public nodeTypes: _Registry;

	readonly superType = 'Flow';
	readonly id;

	public readonly canvas: FlowCanvasHandler;
	public readonly nodes: FlowNodeHandler<_Registry>;
	public readonly links: FlowLinkHandler<_Registry>;
	public readonly gui: FlowGuiHandler;

	public constructor(options?: FlowConstructorParameters<_Registry>) {
		super();
		this.nodeTypes = options?.nodeTypes || ({} as _Registry);
		this.id = options?.id ?? crypto.randomUUID();

		const dispatch = (
			method: string,
			arguments_: IArguments | undefined,
			// eslint-disable-next-line unicorn/consistent-function-scoping
		): void => this.dispatch(method, arguments_, this);

		this.canvas = new FlowCanvasHandler({ dispatch });
		this.nodes = new FlowNodeHandler({
			nodeTypes: this.nodeTypes,
			flow: this,
			dispatch,
			canvas: this.canvas,
		});
		this.links = new FlowLinkHandler({
			canvas: this.canvas,
			nodes: this.nodes,
		});
		this.gui = new FlowGuiHandler({ dispatch });

		if (options?.initialNodes)
			this.fromJSON({ nodeInfos: options.initialNodes });
		if (options?.menu) this.gui.registerMenu(options.menu);
	}

	public fromJSON(options: {
		nodeInfos: NodeInitOf<_Registry>[];
		clear?: boolean;
	}): void {
		if (options.clear) this.nodes.clear();
		for (const nodeInfo of options.nodeInfos)
			this.nodes.add(nodeInfo, { avoidOverlap: false });

		for (const nodeInfo of options.nodeInfos)
			for (const portKey in nodeInfo.ports) {
				const port = (nodeInfo.ports as any)[portKey];
				if (!port) continue;

				const nodeSource = this.nodes.list.find((n) => n.id === nodeInfo.id);
				const portSource =
					nodeSource?.ports[portKey as keyof typeof nodeSource.ports];

				if (portSource && nodeSource && 'value' in port)
					portSource.updateValue(port.value);

				if (!port.connectedTo) continue;
				for (const target of port.connectedTo) {
					const nodeTarget = this.nodes.list.find((n) => n.id === target.node);

					if (nodeTarget && nodeSource) {
						const portTarget =
							nodeTarget.ports[target.port as keyof typeof nodeTarget.ports];
						if (!portSource || !portTarget) continue;

						portSource.connectTo(portTarget);
					}
				}
			}
	}

	public static readonly CONTEXT = createContext<GenericFlow>(
		Symbol('NFE_FLOW'),
	);

	public async autoLayout(): Promise<void> {
		await autoLayout(this);
		this.dispatch(this.autoLayout.name, arguments, this);
	}

	public toJSON(): {
		nodes: NodeInitOf<_Registry>[];
	} {
		return {
			nodes: this.nodes.list.map((node) =>
				node.toJSON(),
			) as NodeInitOf<_Registry>[],
		};
	}
}
