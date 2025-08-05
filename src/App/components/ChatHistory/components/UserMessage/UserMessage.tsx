import { SimplifiedUserChatItem } from '@/electron/state/llmState.ts';
import { MessageMarkdownWithSVG } from '../../../MessageMarkdownWithSVG/MessageMarkdownWithSVG.tsx';
import { DeleteMessageButton } from '../ModelMessage/components/DeleteMessageButton/DeleteMessageButton.tsx';

import './UserMessage.css';

export function UserMessage({ message }: UserMessageProps) {
    return (
        <div className="message user">
            <MessageMarkdownWithSVG className="text">{message.message}</MessageMarkdownWithSVG>
            <div className="buttons items-center">
                <DeleteMessageButton message={message} />
            </div>
        </div>
    );
}

type UserMessageProps = {
    message: SimplifiedUserChatItem;
};
