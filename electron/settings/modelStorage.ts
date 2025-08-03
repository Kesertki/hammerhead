import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { createModelDownloader, type ModelDownloader } from 'node-llama-cpp';

export interface ModelDownloadProgress {
    modelId: string;
    title: string;
    downloadUrl: string;
    totalSize: number;
    downloadedSize: number;
    percentage: number;
    status: 'downloading' | 'completed' | 'error' | 'cancelled';
    error?: string;
    filePath?: string;
}

export interface ModelInfo {
    id: string;
    title: string;
    description: string;
    size: number;
    author: string;
    variants: string[];
    filePath: string;
    fileSize: number;
    downloadedAt: string;
    downloadUrl: string;
    modelUrl?: string;
}

export interface ModelMetadata {
    models: Record<string, ModelInfo>;
    lastUpdated: string;
}

class ModelStorage {
    private modelDirectoryPath: string;
    private metadataFilePath: string;
    private isInitialized = false;
    private activeDownloaders = new Map<string, { downloader: ModelDownloader; abortController: AbortController }>();
    private progressCallbacks = new Set<(progress: ModelDownloadProgress) => void>();

    constructor() {
        // Set up models directory path in app data directory
        const userDataPath = app.getPath('userData');
        this.modelDirectoryPath = path.join(userDataPath, 'models');
        this.metadataFilePath = path.join(this.modelDirectoryPath, 'models.json');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Ensure models directory exists
            await fs.mkdir(this.modelDirectoryPath, { recursive: true });
            this.isInitialized = true;
            console.log('Model storage initialized at:', this.modelDirectoryPath);
        } catch (error) {
            console.error('Failed to initialize model storage:', error);
            throw error;
        }
    }

    onProgressUpdate(callback: (progress: ModelDownloadProgress) => void): () => void {
        this.progressCallbacks.add(callback);
        return () => {
            this.progressCallbacks.delete(callback);
        };
    }

    private notifyProgress(progress: ModelDownloadProgress): void {
        for (const callback of this.progressCallbacks) {
            try {
                callback(progress);
            } catch (error) {
                console.error('Error in progress callback:', error);
            }
        }
    }

    private getAbsoluteFilePath(relativePath: string): string {
        return path.resolve(this.modelDirectoryPath, relativePath);
    }

    public getModelAbsolutePath(relativePath: string): string {
        return this.getAbsoluteFilePath(relativePath);
    }

    private async loadMetadata(): Promise<ModelMetadata> {
        try {
            const data = await fs.readFile(this.metadataFilePath, 'utf-8');
            return JSON.parse(data);
        } catch {
            // If file doesn't exist or is invalid, return empty metadata
            return {
                models: {},
                lastUpdated: new Date().toISOString(),
            };
        }
    }

    private async saveMetadata(metadata: ModelMetadata): Promise<void> {
        try {
            metadata.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to save model metadata:', error);
            throw error;
        }
    }

    private async addModelToMetadata(modelInfo: ModelInfo): Promise<void> {
        const metadata = await this.loadMetadata();
        metadata.models[modelInfo.id] = modelInfo;
        await this.saveMetadata(metadata);
    }

    private async removeModelFromMetadata(modelId: string): Promise<void> {
        const metadata = await this.loadMetadata();
        delete metadata.models[modelId];
        await this.saveMetadata(metadata);
    }

    async downloadModel(
        modelId: string,
        title: string,
        downloadUrl: string,
        author?: string,
        description?: string,
        size?: number,
        variants?: string[]
    ): Promise<ModelInfo> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.activeDownloaders.has(modelId)) {
            throw new Error(`Model ${modelId} is already being downloaded`);
        }

        try {
            const abortController = new AbortController();
            const downloader = await createModelDownloader({
                modelUri: downloadUrl,
                dirPath: this.modelDirectoryPath,
            });

            this.activeDownloaders.set(modelId, { downloader, abortController });

            // Initial progress
            this.notifyProgress({
                modelId,
                title,
                downloadUrl,
                totalSize: downloader.totalSize,
                downloadedSize: 0,
                percentage: 0,
                status: 'downloading',
            });

            // Start progress monitoring
            const progressInterval = setInterval(() => {
                const progress: ModelDownloadProgress = {
                    modelId,
                    title,
                    downloadUrl,
                    totalSize: downloader.totalSize,
                    downloadedSize: downloader.downloadedSize,
                    percentage: Math.round((downloader.downloadedSize / downloader.totalSize) * 100),
                    status: 'downloading',
                };
                this.notifyProgress(progress);
            }, 1000);

            try {
                const modelPath = await downloader.download({
                    signal: abortController.signal,
                });

                clearInterval(progressInterval);

                // Get file stats
                const stats = await fs.stat(modelPath);

                const modelInfo: ModelInfo = {
                    id: modelId,
                    title,
                    description: description || '',
                    size: size || 0,
                    author: author || 'unknown',
                    variants: variants || ['Downloaded'],
                    filePath: path.relative(this.modelDirectoryPath, modelPath),
                    fileSize: stats.size,
                    downloadedAt: new Date().toISOString(),
                    downloadUrl,
                };

                // Add to metadata
                await this.addModelToMetadata(modelInfo);

                // Final progress update
                this.notifyProgress({
                    modelId,
                    title,
                    downloadUrl,
                    totalSize: downloader.totalSize,
                    downloadedSize: downloader.downloadedSize,
                    percentage: 100,
                    status: 'completed',
                    filePath: modelPath,
                });

                console.log('Model downloaded successfully:', modelInfo);
                return modelInfo;
            } catch (error) {
                clearInterval(progressInterval);

                if (abortController.signal.aborted) {
                    this.notifyProgress({
                        modelId,
                        title,
                        downloadUrl,
                        totalSize: downloader.totalSize,
                        downloadedSize: downloader.downloadedSize,
                        percentage: Math.round((downloader.downloadedSize / downloader.totalSize) * 100),
                        status: 'cancelled',
                    });
                    throw new Error('Download cancelled');
                } else {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.notifyProgress({
                        modelId,
                        title,
                        downloadUrl,
                        totalSize: downloader.totalSize,
                        downloadedSize: downloader.downloadedSize,
                        percentage: Math.round((downloader.downloadedSize / downloader.totalSize) * 100),
                        status: 'error',
                        error: errorMessage,
                    });
                    throw error;
                }
            }
        } finally {
            this.activeDownloaders.delete(modelId);
        }
    }

    async cancelDownload(modelId: string): Promise<boolean> {
        const downloader = this.activeDownloaders.get(modelId);
        if (!downloader) {
            return false;
        }

        try {
            downloader.abortController.abort();
            await downloader.downloader.cancel({ deleteTempFile: true });
            return true;
        } catch (error) {
            console.error('Failed to cancel download:', error);
            return false;
        }
    }

    isDownloading(modelId?: string): boolean {
        if (modelId) {
            return this.activeDownloaders.has(modelId);
        }
        return this.activeDownloaders.size > 0;
    }

    getActiveDownloads(): string[] {
        return Array.from(this.activeDownloaders.keys());
    }

    async listDownloadedModels(): Promise<ModelInfo[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const metadata = await this.loadMetadata();
            const models = Object.values(metadata.models);

            // Verify files still exist and clean up metadata if they don't
            const validModels: ModelInfo[] = [];
            for (const model of models) {
                try {
                    const absoluteFilePath = this.getAbsoluteFilePath(model.filePath);
                    await fs.access(absoluteFilePath);
                    validModels.push(model);
                } catch {
                    // File doesn't exist, remove from metadata
                    console.warn(`Model file ${model.filePath} no longer exists, removing from metadata`);
                    await this.removeModelFromMetadata(model.id);
                }
            }

            // Sort by download date (newest first)
            return validModels.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
        } catch (error) {
            console.error('Failed to list downloaded models:', error);
            return [];
        }
    }

    async deleteModel(modelId: string): Promise<boolean> {
        try {
            const metadata = await this.loadMetadata();
            const modelToDelete = metadata.models[modelId];

            if (!modelToDelete) {
                console.warn(`Model with id ${modelId} not found`);
                return false;
            }

            // Delete the file
            try {
                const absoluteFilePath = this.getAbsoluteFilePath(modelToDelete.filePath);
                await fs.unlink(absoluteFilePath);
            } catch (error) {
                console.warn(`Failed to delete file ${modelToDelete.filePath}:`, error);
                // Continue to remove from metadata even if file deletion fails
            }

            // Remove from metadata
            await this.removeModelFromMetadata(modelId);

            console.log('Model deleted:', modelToDelete.title);
            return true;
        } catch (error) {
            console.error('Failed to delete model:', error);
            return false;
        }
    }

    async isModelDownloaded(modelId: string): Promise<boolean> {
        try {
            const metadata = await this.loadMetadata();
            return modelId in metadata.models;
        } catch (error) {
            console.error('Failed to check if model is downloaded:', error);
            return false;
        }
    }

    async getDownloadedModel(modelId: string): Promise<ModelInfo | null> {
        try {
            const metadata = await this.loadMetadata();
            return metadata.models[modelId] || null;
        } catch (error) {
            console.error('Failed to get downloaded model:', error);
            return null;
        }
    }

    async clearAllModels(): Promise<number> {
        try {
            const metadata = await this.loadMetadata();
            const models = Object.values(metadata.models);
            let deletedCount = 0;

            for (const model of models) {
                try {
                    const absoluteFilePath = this.getAbsoluteFilePath(model.filePath);
                    await fs.unlink(absoluteFilePath);
                    deletedCount++;
                } catch (error) {
                    console.warn(`Failed to delete ${model.title}:`, error);
                }
            }

            // Clear all metadata
            await this.saveMetadata({ models: {}, lastUpdated: new Date().toISOString() });

            console.log(`Cleared ${deletedCount} model files`);
            return deletedCount;
        } catch (error) {
            console.error('Failed to clear model files:', error);
            return 0;
        }
    }

    getModelDirectoryPath(): string {
        return this.modelDirectoryPath;
    }

    async getDirectorySize(): Promise<number> {
        try {
            const models = await this.listDownloadedModels();
            return models.reduce((total, model) => total + model.fileSize, 0);
        } catch (error) {
            console.error('Failed to calculate directory size:', error);
            return 0;
        }
    }
}

// Create singleton instance
export const modelStorage = new ModelStorage();

// Export convenience functions
export const getModelAbsolutePath = (relativePath: string) => modelStorage.getModelAbsolutePath(relativePath);

export const downloadModel = (
    modelId: string,
    title: string,
    downloadUrl: string,
    author?: string,
    description?: string,
    size?: number,
    variants?: string[]
) => modelStorage.downloadModel(modelId, title, downloadUrl, author, description, size, variants);
export const cancelDownload = (modelId: string) => modelStorage.cancelDownload(modelId);
export const isDownloading = (modelId?: string) => modelStorage.isDownloading(modelId);
export const getActiveDownloads = () => modelStorage.getActiveDownloads();
export const listDownloadedModels = () => modelStorage.listDownloadedModels();
export const deleteModel = (modelId: string) => modelStorage.deleteModel(modelId);
export const clearAllModels = () => modelStorage.clearAllModels();
export const getModelDirectoryPath = () => modelStorage.getModelDirectoryPath();
export const initializeModelStorage = () => modelStorage.initialize();
export const onProgressUpdate = (callback: (progress: ModelDownloadProgress) => void) =>
    modelStorage.onProgressUpdate(callback);
export const isModelDownloaded = (modelId: string) => modelStorage.isModelDownloaded(modelId);
export const getDownloadedModel = (modelId: string) => modelStorage.getDownloadedModel(modelId);
