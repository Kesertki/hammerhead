import { RotateCcw } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { SimplifiedModelChatItem } from '@/electron/state/llmState';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { useTranslation } from 'react-i18next';

import './RegenerateButton.css';

export function RegenerateButton({ modelMessage, disabled }: RegenerateButtonProps) {
    const { t } = useTranslation();

    const onClick = useCallback(() => {
        if (!disabled) {
            void electronLlmRpc.regenerateMessage(modelMessage);
        }
    }, [modelMessage, disabled]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" className="regenerateButton" onClick={onClick} disabled={disabled}>
                    <RotateCcw className="icon" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t('actions.regenerate')}</TooltipContent>
        </Tooltip>
    );
}

type RegenerateButtonProps = {
    modelMessage: SimplifiedModelChatItem;
    disabled?: boolean;
};
