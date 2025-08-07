/**
 * ModelSelector - A reusable dropdown component for selecting AI models
 *
 * @example
 * ```tsx
 * <ModelSelector
 *   models={downloadedModels}
 *   selectedModelId={selectedModel}
 *   fallbackName="No model loaded"
 *   loading={isLoading}
 *   onModelSelect={(model) => loadModel(model)}
 *   onBrowseFiles={() => openFileDialog()}
 *   onBrowseModels={() => navigate('/models')}
 * />
 * ```
 */

import { HardDriveUpload, Check, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ModelInfo } from '@/types';
import { formatBytes } from '@/utils/formatBytes';

interface ModelSelectorProps {
    /** Array of available downloaded models */
    models: ModelInfo[];
    /** Currently selected model ID */
    selectedModelId: string;
    /** Display name when no model is selected or loading */
    fallbackName: string;
    /** Whether the component is in loading state */
    loading?: boolean;
    /** Callback when a model is selected */
    onModelSelect: (model: ModelInfo) => void;
    /** Callback when "Browse for model file" is clicked */
    onBrowseFiles: () => void;
    /** Callback when "Browse models..." is clicked */
    onBrowseModels: () => void;
    /** Optional className for styling */
    className?: string;
}

export function ModelSelector({
    models,
    selectedModelId,
    fallbackName,
    loading = false,
    onModelSelect,
    onBrowseFiles,
    onBrowseModels,
    className,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedModel = models.find((model) => model.id === selectedModelId);

    if (loading) {
        return <div className={cn('text-sm', className)}>Loading...</div>;
    }

    if (models.length === 0) {
        return (
            <Button variant="link" size="sm" className={cn('cursor-pointer', className)} onClick={onBrowseFiles}>
                {fallbackName}
            </Button>
        );
    }

    const displayName = selectedModel?.title || fallbackName;

    return (
        <div className={cn('text-sm min-w-0', className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-[250px] justify-between text-left font-normal"
                    >
                        <span className="truncate">{displayName}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                    <Command>
                        <CommandInput placeholder="Search downloaded models..." />
                        <CommandList>
                            <CommandEmpty>No downloaded models found.</CommandEmpty>
                            <CommandGroup>
                                {models.map((model) => (
                                    <CommandItem
                                        key={model.id}
                                        value={model.title}
                                        onSelect={() => {
                                            onModelSelect(model);
                                            setIsOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-medium truncate">{model.title}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {model.author} • {model.size}B params • {formatBytes(model.fileSize)}
                                            </span>
                                        </div>
                                        <Check
                                            className={cn(
                                                'ml-2 h-4 w-4',
                                                selectedModelId === model.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                                <CommandSeparator />
                                <CommandItem
                                    onSelect={() => {
                                        setIsOpen(false);
                                        onBrowseFiles();
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <HardDriveUpload className="h-4 w-4" />
                                        <span>Browse for model file...</span>
                                    </div>
                                </CommandItem>
                                <CommandItem
                                    onSelect={() => {
                                        setIsOpen(false);
                                        onBrowseModels();
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        <span>Browse models...</span>
                                    </div>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
