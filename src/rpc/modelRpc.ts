import { ElectronModelFunctions } from '@/electron/rpc/modelRpc.ts';
import { ModelDownloadProgress } from '@/types';
import { createRendererSideBirpc } from '../utils/createRendererSideBirpc.ts';

// Store for download progress
let currentDownloadProgress: ModelDownloadProgress | null = null;
const progressCallbacks = new Set<(progress: ModelDownloadProgress | null) => void>();

const renderedFunctions = {
    onDownloadProgress(progress: ModelDownloadProgress) {
        currentDownloadProgress = progress;
        // Notify all callbacks
        for (const callback of progressCallbacks) {
            try {
                callback(progress);
            } catch (error) {
                console.error('Error in progress callback:', error);
            }
        }
    },
} as const;

export type RenderedModelFunctions = typeof renderedFunctions;

export const electronModelRpc = createRendererSideBirpc<ElectronModelFunctions, RenderedModelFunctions>(
    'modelRpc',
    'modelRpc',
    renderedFunctions
);

// Export utility functions for components to use
export function onDownloadProgress(callback: (progress: ModelDownloadProgress | null) => void): () => void {
    progressCallbacks.add(callback);

    // Send current progress immediately if available
    if (currentDownloadProgress) {
        try {
            callback(currentDownloadProgress);
        } catch (error) {
            console.error('Error in progress callback:', error);
        }
    }

    return () => {
        progressCallbacks.delete(callback);
    };
}

export function getCurrentDownloadProgress(): ModelDownloadProgress | null {
    return currentDownloadProgress;
}

// Initialize model storage on startup
electronModelRpc
    .initializeModelStorage()
    .then(() => {
        console.log('Model storage initialized');
    })
    .catch((error) => {
        console.error('Failed to initialize model storage:', error);
    });
