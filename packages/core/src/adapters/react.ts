// NOTE: Keep. Disabled for now. No third parties in core

// import { useEffect, useReducer } from 'react';

// import type { GenericFlow, GenericNode, GenericPort } from '../types.js';

// export function useFlow(flow: GenericFlow): void {
//   const [, forceUpdate] = useReducer((x) => x + 1, 0);

//   useEffect(() => {
//     const aborter = flow.listen((detail) => {
//       if (detail.type === 'Flow') forceUpdate();
//     });
//     return () => aborter.abort();
//   }, [flow]);
// }

// export function useNode(node: GenericNode): void {
//   const [, forceUpdate] = useReducer((x) => x + 1, 0);

//   useEffect(() => {
//     const aborter = node.flow.listen((detail) => {
//       if (detail.type === 'Node' && detail.instance === node) forceUpdate();
//     });
//     return () => aborter.abort();
//   }, [node]);
// }

// export function usePort(port: GenericPort): void {
//   const [, forceUpdate] = useReducer((x) => x + 1, 0);

//   useEffect(() => {
//     const aborter = port.flow.listen((detail) => {
//       if (detail.type === 'Port' && detail.instance === port) forceUpdate();
//     });
//     return () => aborter.abort();
//   }, [port]);
// }
throw new Error('Do not import');
