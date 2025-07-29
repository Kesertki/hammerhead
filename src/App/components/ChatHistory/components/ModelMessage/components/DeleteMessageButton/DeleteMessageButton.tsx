import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { SimplifiedUserChatItem } from '@/electron/state/llmState';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';

import './DeleteMessageButton.css';

export function DeleteMessageButton({ message }: DeleteMessageButtonProps) {
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
            <TooltipContent>Delete</TooltipContent>
        </Tooltip>
    );
}

type DeleteMessageButtonProps = {
    message: SimplifiedUserChatItem;
};
