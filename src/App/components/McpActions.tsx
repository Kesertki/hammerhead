import { Save, RotateCcw, AlignJustify, RotateCcw as Reset } from 'lucide-react';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';

export interface McpState {
    hasUnsavedChanges: boolean;
    validationErrors: number;
}

interface McpActionsProps {
    mcpState: McpState;
    onAction: (action: string) => void;
}

export function McpActions({ mcpState, onAction }: McpActionsProps) {
    return (
        <div className="flex gap-2 items-center">
            {mcpState.hasUnsavedChanges && (
                <Badge variant="secondary" className="text-xs ml-2">
                    Unsaved
                </Badge>
            )}
            {mcpState.validationErrors > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                    {mcpState.validationErrors} Error(s)
                </Badge>
            )}

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        onClick={() => onAction('save')}
                        disabled={!mcpState.hasUnsavedChanges || mcpState.validationErrors > 0}
                        className="gap-1"
                    >
                        <Save className="h-3 w-3" />
                        Save
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Save MCP configuration</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onAction('reload')} className="gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Reload
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reload configuration from file</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onAction('format')} className="gap-1">
                        <AlignJustify className="h-3 w-3" />
                        Format
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Format JSON configuration</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onAction('reset')} className="gap-1">
                        <Reset className="h-3 w-3" />
                        Reset
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reset to default configuration</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
