import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { SimplifiedUserChatItem } from '@/electron/state/llmState';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { useTranslation } from 'react-i18next';

import './DeleteMessageButton.css';

export function DeleteMessageButton({ message }: DeleteMessageButtonProps) {
    const { t } = useTranslation();

    const onClick = useCallback(() => {
        void electronLlmRpc.deleteMessage(message);
    }, [message]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" className="deleteButton" onClick={onClick}>
                    <Trash2 />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t('actions.delete')}</TooltipContent>
        </Tooltip>
    );
}

type DeleteMessageButtonProps = {
    message: SimplifiedUserChatItem;
};
