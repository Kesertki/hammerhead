import { useState, useEffect } from 'react';

export interface ModelFile {
    name: string;
    url: string;
    size?: number;
}

export function useModelVariantFiles(downloadUrl: string) {
    const [files, setFiles] = useState<ModelFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!downloadUrl) return;

        const fetchFiles = async () => {
            setLoading(true);
            setError(null);

            try {
                // Make HEAD request to get file size
                const response = await fetch(downloadUrl, { method: 'HEAD' });

                if (!response.ok) {
                    throw new Error(`Failed to fetch file info: ${response.status} ${response.statusText}`);
                }

                const contentLength = response.headers.get('content-length');
                const size = contentLength ? parseInt(contentLength, 10) : undefined;

                // Extract filename from URL
                const fileName = downloadUrl.split('/').pop() || 'model.gguf';

                setFiles([
                    {
                        name: fileName,
                        url: downloadUrl,
                        size,
                    },
                ]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setFiles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [downloadUrl]);

    return { files, loading, error };
}
