import { Plus, Edit3, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    return (
        <div className="flex gap-2 items-center">
            <Select value={systemPromptState.activePromptId} onValueChange={onPromptChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('prompts.select_a_prompt')} />
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
                    <Button variant="ghost" size="sm" onClick={() => onAction('add')} className="cursor-pointer">
                        <Plus />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('prompts.create_new')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('rename')}
                        disabled={!systemPromptState.activePromptId}
                        className="cursor-pointer"
                    >
                        <Edit3 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('prompts.rename_current')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onAction('save')} className="cursor-pointer">
                        <Save />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('prompts.save_current')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('delete')}
                        disabled={!systemPromptState.canDelete}
                        className="cursor-pointer"
                    >
                        <Trash2 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('prompts.delete_current')}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
