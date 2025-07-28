import { SimplifiedUserChatItem } from '@/electron/state/llmState.ts';
import { MessageMarkdown } from '../../../MessageMarkdown/MessageMarkdown';
import { DeleteMessageButton } from '../ModelMessage/components/DeleteMessageButton/DeleteMessageButton.tsx';

import './UserMessage.css';

export function UserMessage({ message }: UserMessageProps) {
	return (
		<div className="message user">
			<MessageMarkdown className="text">
				{message.message}
			</MessageMarkdown>
			<div className="buttons items-center">
				<DeleteMessageButton message={message} />
			</div>
		</div>
	);
}

type UserMessageProps = {
	message: SimplifiedUserChatItem;
};
