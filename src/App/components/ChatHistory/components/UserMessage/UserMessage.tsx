import { SimplifiedUserChatItem } from '@/electron/state/llmState.ts';
import { MessageMarkdown } from '../../../MessageMarkdown/MessageMarkdown';

import './UserMessage.css';

export function UserMessage({ message }: UserMessageProps) {
	return (
		<MessageMarkdown className="message user">
			{message.message}
		</MessageMarkdown>
	);
}

type UserMessageProps = {
	message: SimplifiedUserChatItem;
};
