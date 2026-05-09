import { Node } from './node.js';
import type {
	NodeConstructorParameters,
	NodeSerializableOptions,
	NodeDefinition,
} from './types.js';
import { defineNode } from './types.js';

/**
 * Placeholder node created when a flow is deserialised and the required node
 * type is absent from the registry (e.g. the user disabled a plugin).
 *
 * Key properties:
 *  - `isMissing`   — always `true`, lets consumers identify placeholders
 *  - `missingType` — the original, unregistered type string
 *
 * Ports are inferred from the serialised port keys with direction `'both'`,
 * which is sufficient for connection restoration without requiring type info.
 */

const missingNodeDefinition = defineNode({
	type: 'MissingNode',
	defaultDisplayName: '⚠ Missing node',
	defaultIcon: 'alert-triangle',
	helpText: 'This node type is not available in the current registry.',
	ports: {},
});

type MissingNodeSerializableOptions = NodeSerializableOptions<
	Node<NodeDefinition>
>;

export class MissingNode extends Node<typeof missingNodeDefinition> {
	public static override readonly definition = missingNodeDefinition;

	/** Always `true` — lets consumers quickly identify placeholder nodes. */
	public readonly isMissing = true as const;

	/** The original type string that was absent from the registry. */
	public readonly missingType: string;

	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		options: NodeConstructorParameters<any> & { missingType: string },
	) {
		// Pass data through to Node base, but without `type` so the base doesn't
		// try to look it up — the static definition already provides 'MissingNode'.
		super(options);
		this.missingType = options.missingType;

		// Infer ports from serialised data if present.
		const rawPorts = options.data?.ports as
			| Record<string, { direction?: string } | null>
			| undefined;

		if (rawPorts) {
			for (const [name, portData] of Object.entries(rawPorts)) {
				if (!portData) continue;
				// Use direction from serialised data when present; default to 'both'
				// so the port can participate in connections regardless of orientation.
				const direction =
					portData.direction === 'in' || portData.direction === 'out'
						? portData.direction
						: 'both';

				this.publishPort(name, { direction });
			}
		}
	}

	/**
	 * Override toJSON to preserve the original missing type string so that a
	 * serialised-then-deserialised flow still carries the placeholder correctly.
	 */
	public override toJSON(): MissingNodeSerializableOptions {
		return {
			...super.toJSON(),
			type: this.missingType,
		};
	}
}
