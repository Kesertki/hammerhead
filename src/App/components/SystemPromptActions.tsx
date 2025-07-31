import { Plus, Edit3, Save, Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';

export interface SystemPromptState {
    activePromptId: string;
    prompts: Array<{ id: string; name: string }>;
    canDelete: boolean;
}

interface SystemPromptActionsProps {
    systemPromptState: SystemPromptState;
    onAction: (action: string) => void;
    onPromptChange: (promptId: string) => void;
}

export function SystemPromptActions({ systemPromptState, onAction, onPromptChange }: SystemPromptActionsProps) {
    return (
        <div className="flex gap-2 items-center">
            <Select value={systemPromptState.activePromptId} onValueChange={onPromptChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a prompt" />
                </SelectTrigger>
                <SelectContent>
                    {systemPromptState.prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onAction('add')} className="gap-1">
                        <Plus className="h-3 w-3" />
                        Add
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Create new system prompt</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction('rename')}
                        disabled={!systemPromptState.activePromptId}
                        className="gap-1"
                    >
                        <Edit3 className="h-3 w-3" />
                        Rename
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Rename current prompt</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button size="sm" onClick={() => onAction('save')} className="gap-1">
                        <Save className="h-3 w-3" />
                        Save
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Save current prompt</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onAction('delete')}
                        disabled={!systemPromptState.canDelete}
                        className="gap-1"
                    >
                        <Trash2 className="h-3 w-3" />
                        Delete
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Delete current prompt</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
