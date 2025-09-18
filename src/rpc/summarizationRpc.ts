import type { ElectronSummarizationFunctions } from '@/electron/rpc/summarizationRpc.ts';
import { createRendererSideBirpc } from '../utils/createRendererSideBirpc.ts';

const renderedFunctions = {} as const;

export type RenderedSummarizationFunctions = typeof renderedFunctions;

console.log('Creating summarization RPC connection...');

export const electronSummarizationRpc = createRendererSideBirpc<
    ElectronSummarizationFunctions,
    RenderedSummarizationFunctions
>('summarizationRpc', 'summarizationRpc', renderedFunctions);

console.log('Summarization RPC created:', electronSummarizationRpc);
