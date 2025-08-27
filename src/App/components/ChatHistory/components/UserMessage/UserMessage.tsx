import { SimplifiedUserChatItem } from '@/electron/state/llmState.ts';
import { MessageMarkdownWithSVG } from '../../../MessageMarkdownWithSVG/MessageMarkdownWithSVG.tsx';
import { DeleteMessageButton } from '../ModelMessage/components/DeleteMessageButton/DeleteMessageButton.tsx';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { llmState } from '@/state/llmState.ts';

import './UserMessage.css';

export function UserMessage({ message }: UserMessageProps) {
    const state = useExternalState(llmState);
    return (
        <div className="message user">
            <MessageMarkdownWithSVG className="text">{message.message}</MessageMarkdownWithSVG>
            <div className="buttons items-center">
                {state.model.loaded && <DeleteMessageButton message={message} />}
            </div>
        </div>
    );
}

type UserMessageProps = {
    message: SimplifiedUserChatItem;
};
