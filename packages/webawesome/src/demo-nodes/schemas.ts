import { type, type JsonSchema } from 'arktype';

export type PortsWithSchema = {
	schema?: Record<string, unknown>;
	hidden?: true;
};

// --- Standard Schema validators (ArkType) ---

export const numberSchema = type('number | string.numeric.parse');
export const textSchema = type('string');

// --- JSON schema for UI rendering (jsf-shoelace, etc.) ---

// It's separate, for convenience. ArkType doesn't handle metadata like "title", default is finnicky…
// TODO: Investigate a more ergonomic/integrated solution.

export const numberPortJsonSchema = {
	type: 'number',
	title: 'Number',
	default: 1,
	// maximum: 50,
} as const satisfies JsonSchema;

export const textPortJsonSchema = {
	type: 'string',
	title: 'Text',
	default: 'Type here…',
} as const satisfies JsonSchema;
