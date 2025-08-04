import React from 'react';
import { useModelVariantFiles } from '../hooks/useModelVariantFiles';
import { formatBytes } from '../utils/formatBytes';

interface ModelSizeDisplayProps {
    downloadUrl: string;
    className?: string;
}

export function ModelSizeDisplay({ downloadUrl, className }: ModelSizeDisplayProps) {
    const { files, loading, error } = useModelVariantFiles(downloadUrl);

    if (loading) return <span className={className}>Loading size...</span>;
    if (error) return <span className={className}>Size unknown</span>;
    if (!files.length) return <span className={className}>Size unknown</span>;

    const file = files[0];
    if (!file) return <span className={className}>Size unknown</span>;

    return <span className={className}>{formatBytes(file.size)}</span>;
}
