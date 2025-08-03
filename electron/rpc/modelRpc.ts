import { BrowserWindow } from 'electron';
import type { ModelDownloadProgress, ModelInfo } from '../settings/modelStorage.ts';
import { modelStorage, downloadModel } from '../settings/modelStorage.ts';
import { createElectronSideBirpc } from '../utils/createElectronSideBirpc.ts';

// Define the interface for renderer-side functions
export interface RenderedModelFunctions {
    onDownloadProgress: (progress: ModelDownloadProgress) => void;
}

export class ElectronModelRpc {
    public readonly rendererModelRpc: ReturnType<
        typeof createElectronSideBirpc<RenderedModelFunctions, typeof this.functions>
    >;

    public readonly functions = {
        downloadModel: async (
            modelId: string,
            title: string,
            downloadUrl: string,
            author?: string,
            description?: string,
            size?: number,
            variants?: string[]
        ) => {
            return downloadModel(modelId, title, downloadUrl, author, description, size, variants);
        },

        async cancelDownload(modelId: string): Promise<boolean> {
            return await modelStorage.cancelDownload(modelId);
        },

        async listDownloadedModels(): Promise<ModelInfo[]> {
            return await modelStorage.listDownloadedModels();
        },

        async deleteModel(modelId: string): Promise<boolean> {
            return await modelStorage.deleteModel(modelId);
        },

        async getModelAbsolutePath(modelId: string): Promise<string | null> {
            const model = await modelStorage.getDownloadedModel(modelId);
            if (!model) {
                return null;
            }
            return modelStorage.getModelAbsolutePath(model.filePath);
        },

        async clearAllModels(): Promise<number> {
            return await modelStorage.clearAllModels();
        },

        async getModelDirectoryPath(): Promise<string> {
            return modelStorage.getModelDirectoryPath();
        },

        async getDirectorySize(): Promise<number> {
            return await modelStorage.getDirectorySize();
        },

        async initializeModelStorage(): Promise<void> {
            return await modelStorage.initialize();
        },

        isDownloading(modelId?: string): boolean {
            return modelStorage.isDownloading(modelId);
        },

        getActiveDownloads(): string[] {
            return modelStorage.getActiveDownloads();
        },

        async isModelDownloaded(modelId: string): Promise<boolean> {
            return await modelStorage.isModelDownloaded(modelId);
        },

        async getDownloadedModel(modelId: string): Promise<ModelInfo | null> {
            return await modelStorage.getDownloadedModel(modelId);
        },
    } as const;

    private progressUnsubscribe?: () => void;

    public constructor(window: BrowserWindow) {
        this.rendererModelRpc = createElectronSideBirpc<RenderedModelFunctions, typeof this.functions>(
            'modelRpc',
            'modelRpc',
            window,
            this.functions
        );

        // Set up progress monitoring
        this.progressUnsubscribe = modelStorage.onProgressUpdate((progress) => {
            this.rendererModelRpc.onDownloadProgress(progress).catch((error) => {
                console.warn('Failed to send download progress to renderer:', error);
            });
        });
    }

    public destroy(): void {
        if (this.progressUnsubscribe) {
            this.progressUnsubscribe();
            this.progressUnsubscribe = undefined;
        }
    }
}

export type ElectronModelFunctions = typeof ElectronModelRpc.prototype.functions;

export function registerModelRpc(window: BrowserWindow): ElectronModelRpc {
    return new ElectronModelRpc(window);
}
