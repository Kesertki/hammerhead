import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserWindow, dialog } from 'electron';
import type { RenderedFunctions } from '../../src/rpc/llmRpc.ts';
import { llmFunctions, llmState } from '../state/llmState.ts';
import { createElectronSideBirpc } from '../utils/createElectronSideBirpc.ts';

const modelDirectoryPath = path.join(process.cwd(), 'models');

export class ElectronLlmRpc {
	public readonly rendererLlmRpc: ReturnType<
		typeof createElectronSideBirpc<RenderedFunctions, typeof this.functions>
	>;

	public readonly functions = {
		async exportChatSession(): Promise<boolean> {
			if (llmState.state.chatSession.loaded) {
				const res = await dialog.showSaveDialog({
					message: 'Save chat session',
					title: 'Save chat session',
					filters: [{ name: 'Chat session', extensions: ['json'] }],
					buttonLabel: 'Save',
					defaultPath: path.join(
						modelDirectoryPath,
						`${llmState.state
							.selectedModelFilePath!.split(path.sep)
							.pop()!}.json`
					)
				});

				if (!res.canceled && res.filePath) {
					return await llmFunctions.chatSession.exportChatSession(
						path.resolve(res.filePath)
					);
				}
			}
			return false;
		},
		async importChatSession(): Promise<boolean> {
			const res = await dialog.showOpenDialog({
				message: 'Select a chat session file',
				title: 'Select a chat session file',
				filters: [{ name: 'Chat session', extensions: ['json'] }],
				buttonLabel: 'Open',
				defaultPath: (await pathExists(modelDirectoryPath))
					? modelDirectoryPath
					: undefined,
				properties: ['openFile']
			});
			if (!res.canceled && res.filePaths.length > 0) {
				const filePath = path.resolve(res.filePaths[0]!);
				if (await pathExists(filePath)) {
					return await llmFunctions.chatSession.importChatSession(
						filePath
					);
				}
			}
			return false;
		},
		async selectModelFileAndLoad() {
			const res = await dialog.showOpenDialog({
				message: 'Select a model file',
				title: 'Select a model file',
				filters: [{ name: 'Model file', extensions: ['gguf'] }],
				buttonLabel: 'Open',
				defaultPath: (await pathExists(modelDirectoryPath))
					? modelDirectoryPath
					: undefined,
				properties: ['openFile']
			});

			if (!res.canceled && res.filePaths.length > 0) {
				llmState.state = {
					...llmState.state,
					selectedModelFilePath: path.resolve(res.filePaths[0]!),
					chatSession: {
						loaded: false,
						generatingResult: false,
						simplifiedChat: []
					}
				};

				if (!llmState.state.llama.loaded)
					await llmFunctions.loadLlama();

				await llmFunctions.loadModel(
					llmState.state.selectedModelFilePath!
				);
				await llmFunctions.createContext();
				await llmFunctions.createContextSequence();
				await llmFunctions.chatSession.createChatSession();
			}
		},
		getState() {
			return llmState.state;
		},
		prompt: llmFunctions.chatSession.prompt,
		stopActivePrompt: llmFunctions.chatSession.stopActivePrompt,
		resetChatHistory: llmFunctions.chatSession.resetChatHistory
	} as const;

	public constructor(window: BrowserWindow) {
		this.rendererLlmRpc = createElectronSideBirpc<
			RenderedFunctions,
			typeof this.functions
		>('llmRpc', 'llmRpc', window, this.functions);

		this.sendCurrentLlmState = this.sendCurrentLlmState.bind(this);

		llmState.createChangeListener(this.sendCurrentLlmState);
		// Don't wait for initial state update to avoid blocking constructor
		this.sendCurrentLlmState().catch((error) =>
			console.warn('Failed to send initial LLM state:', error)
		);
	}

	public async sendCurrentLlmState() {
		try {
			await this.rendererLlmRpc.updateState(llmState.state);
		} catch (error) {
			console.warn('Failed to update LLM state in renderer:', error);
		}
	}
}

export type ElectronFunctions = typeof ElectronLlmRpc.prototype.functions;

export function registerLlmRpc(window: BrowserWindow) {
	new ElectronLlmRpc(window);
}

async function pathExists(path: string) {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}
