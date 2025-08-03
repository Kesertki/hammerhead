import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { electronModelRpc, onDownloadProgress, getCurrentDownloadProgress } from '@/rpc/modelRpc';
import type { ModelDownloadProgress } from '@/types';
import { toast } from 'sonner';
import { Download, Trash2, OctagonX } from 'lucide-react';

interface ModelDetails {
    title: string;
    description: string;
    size: number;
    author: string;
    authorUrl: string;
    modelUrl: string;
    downloadLink: string;
    variants: string[];
}

const models: ModelDetails[] = [
    {
        title: 'Qwen3-8B',
        description: 'A 8B parameter version of the Qwen model.',
        size: 8,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-8B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q6_K.gguf',
        variants: ['Q6_K'],
    },
    {
        title: 'Qwen3-4B',
        description: 'A 4B parameter version of the Qwen model.',
        size: 4,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-4B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Qwen3-1.7B',
        description: 'A 1.7B parameter version of the Qwen model.',
        size: 1.7,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-1.7B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q8_0.gguf',
        variants: ['Q8_0'],
    },
    {
        title: 'Qwen3-0.6B',
        description: 'A 0.6B parameter version of the Qwen model.',
        size: 0.6,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
        variants: ['Q8_0'],
    },
    {
        title: 'DeepSeek R1 Distill Qwen 7B',
        description: 'A distilled version of the Qwen model optimized for performance.',
        size: 7,
        author: 'team mradermacher',
        authorUrl: 'https://huggingface.co/mradermacher',
        modelUrl: 'https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF',
        downloadLink:
            'https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B.Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Meta Llama 3.1 8B Instruct',
        description: 'An 8B instruction-tuned version of the Meta Llama 3.1 model.',
        size: 8,
        author: 'team mradermacher',
        authorUrl: 'https://huggingface.co/mradermacher',
        modelUrl: 'https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF',
        downloadLink:
            'https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Gemma 2 2B',
        description: 'A 2B parameter version of the Gemma 2 model.',
        size: 2,
        author: 'Bartowski',
        authorUrl: 'https://huggingface.co/bartowski',
        modelUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF',
        downloadLink: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
];

export function ModelCards() {
    const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null);
    const [isAnyDownloading, setIsAnyDownloading] = useState(false);
    const [downloadedModels, setDownloadedModels] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Set initial state
        const currentProgress = getCurrentDownloadProgress();
        setDownloadProgress(currentProgress);
        setIsAnyDownloading(currentProgress?.status === 'downloading');

        // Load downloaded models
        const loadDownloadedModels = async () => {
            try {
                const models = await electronModelRpc.listDownloadedModels();
                const downloadedModelIds = new Set(models.map((model) => model.id));
                setDownloadedModels(downloadedModelIds);
            } catch (error) {
                console.error('Failed to load downloaded models:', error);
            }
        };

        loadDownloadedModels();

        // Subscribe to progress updates
        const unsubscribe = onDownloadProgress((progress) => {
            setDownloadProgress(progress);
            setIsAnyDownloading(progress?.status === 'downloading');

            // If download completed, refresh downloaded models list
            if (progress?.status === 'completed') {
                loadDownloadedModels();
            }
        });

        return unsubscribe;
    }, []);

    const handleDownload = async (model: ModelDetails) => {
        try {
            const modelId = `${model.author}-${model.title.replace(/\s+/g, '-').toLowerCase()}`;
            await electronModelRpc.downloadModel(
                modelId,
                model.title,
                model.downloadLink,
                model.author,
                model.description,
                model.size,
                model.variants
            );
            toast.success(`${model.title} downloaded successfully!`);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error(`Failed to download ${model.title}`);
        }
    };

    const handleDelete = async (model: ModelDetails) => {
        try {
            const modelId = getModelId(model);
            const success = await electronModelRpc.deleteModel(modelId);
            if (success) {
                setDownloadedModels((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(modelId);
                    return newSet;
                });
                toast.success(`${model.title} deleted successfully!`);
            } else {
                toast.error(`Failed to delete ${model.title}`);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(`Failed to delete ${model.title}`);
        }
    };

    const handleCancelDownload = async () => {
        if (!downloadProgress) return;

        try {
            await electronModelRpc.cancelDownload(downloadProgress.modelId);
            toast.info('Download cancelled');
        } catch (error) {
            console.error('Cancel failed:', error);
            toast.error('Failed to cancel download');
        }
    };

    const getModelId = (model: ModelDetails) => {
        return `${model.author}-${model.title.replace(/\s+/g, '-').toLowerCase()}`;
    };

    const isModelDownloading = (model: ModelDetails) => {
        const modelId = getModelId(model);
        return downloadProgress?.modelId === modelId && downloadProgress?.status === 'downloading';
    };

    const isModelDownloadedStatus = (model: ModelDetails) => {
        const modelId = getModelId(model);
        return downloadedModels.has(modelId);
    };

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 md:grid-cols-2 xl:grid-cols-3">
            {models.map((model, index) => (
                <Card key={index} className="@container/card">
                    <CardHeader>
                        <CardDescription>
                            <a
                                href={model.authorUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground hover:underline"
                            >
                                {model.author}
                            </a>
                        </CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            <a
                                href={model.modelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-foreground hover:text-primary hover:underline break-words hyphens-auto block"
                            >
                                {model.title}
                            </a>
                        </CardTitle>
                        {isModelDownloadedStatus(model) && (
                            <div className="text-green-600 text-sm font-medium">Downloaded</div>
                        )}
                        <CardAction>
                            {isModelDownloading(model) ? (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={handleCancelDownload}
                                >
                                    <OctagonX className="h-4 w-4" />
                                </Button>
                            ) : isModelDownloadedStatus(model) ? (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={() => handleDelete(model)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer"
                                    disabled={isAnyDownloading}
                                    onClick={() => handleDownload(model)}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        {isModelDownloading(model) && downloadProgress && (
                            <div className="w-full space-y-1">
                                <Progress value={downloadProgress.percentage} max={100} />
                                <div className="text-xs text-muted-foreground">
                                    {downloadProgress.percentage}% -{' '}
                                    {Math.round(downloadProgress.downloadedSize / (1024 * 1024))}MB /{' '}
                                    {Math.round(downloadProgress.totalSize / (1024 * 1024))}MB
                                </div>
                            </div>
                        )}
                        <div className="line-clamp-1 flex gap-2 font-medium">{model.description}</div>
                        <div className="text-muted-foreground">
                            {model.size}B parameters • {model.variants.length} variant
                            {model.variants.length !== 1 ? 's' : ''}
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
