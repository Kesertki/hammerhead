import React from 'react';
import { useModelVariantFiles } from '../hooks/useModelVariantFiles';
import { formatBytes } from '../utils/formatBytes';

interface ModelVariantDisplayProps {
    downloadUrl: string;
}

export function ModelVariantDisplay({ downloadUrl }: ModelVariantDisplayProps) {
    const { files, loading, error } = useModelVariantFiles(downloadUrl);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!files.length) return <p>No files found.</p>;

    return (
        <ul className="space-y-2">
            {files.map((file) => (
                <li key={file.name} className="flex justify-between">
                    <a href={file.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                        {file.name}
                    </a>
                    <span className="text-gray-500">{formatBytes(file.size)}</span>
                </li>
            ))}
        </ul>
    );
}
