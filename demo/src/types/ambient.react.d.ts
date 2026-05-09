declare global {
	declare module 'react' {
		namespace JSX {
			interface IntrinsicElements extends Nfe {}
		}
	}
}
type Nfe = import('../../types/react.js').NodeFlowElements;
