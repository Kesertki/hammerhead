import { Save, RotateCcw, AlignJustify, RotateCcw as Reset } from 'lucide-react';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useTranslation } from 'react-i18next';

export interface McpState {
    hasUnsavedChanges: boolean;
    validationErrors: number;
}

interface McpActionsProps {
    mcpState: McpState;
    onAction: (action: string) => void;
}

export function McpActions({ mcpState, onAction }: McpActionsProps) {
    const { t } = useTranslation();

    return (
        <div className="flex gap-2 items-center">
            {mcpState.hasUnsavedChanges && (
                <Badge variant="secondary" className="text-xs ml-2">
                    {t('mcp.unsaved')}
                </Badge>
            )}
            {mcpState.validationErrors > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                    {mcpState.validationErrors} {t('mcp.errors')}
                </Badge>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('save')}
                        disabled={!mcpState.hasUnsavedChanges || mcpState.validationErrors > 0}
                        className="cursor-pointer"
                    >
                        <Save className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('mcp.save_tooltip')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onAction('reload')} className="cursor-pointer">
                        <RotateCcw className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('mcp.reload_tooltip')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onAction('format')} className="cursor-pointer">
                        <AlignJustify className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('mcp.format_tooltip')}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onAction('reset')} className="cursor-pointer">
                        <Reset className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('mcp.reset_tooltip')}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
