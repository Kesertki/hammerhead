import type { ElectronChatFunctions } from '@/electron/rpc/chatRpc.ts';
import { createRendererSideBirpc } from '../utils/createRendererSideBirpc.ts';

const renderedFunctions = {} as const;

export type RenderedChatFunctions = typeof renderedFunctions;

console.log('Creating chat RPC connection...');

export const electronChatRpc = createRendererSideBirpc<ElectronChatFunctions, RenderedChatFunctions>(
    'chatRpc',
    'chatRpc',
    renderedFunctions
);

console.log('Chat RPC created:', electronChatRpc);
