import classNames from 'classnames';
import { forwardRef, useMemo } from 'react';
import {
	LlmState,
	SimplifiedModelChatItem
} from '@/electron/state/llmState.ts';
import { ModelMessage } from './components/ModelMessage/ModelMessage.js';
import { UserMessage } from './components/UserMessage/UserMessage.js';

import './ChatHistory.css';

type ChatHistoryProps = {
	simplifiedChat: LlmState['chatSession']['simplifiedChat'];
	generatingResult: boolean;
	className?: string;
};

const emptyModelMessage: SimplifiedModelChatItem = {
	type: 'model',
	message: []
};

export const ChatHistory = forwardRef<HTMLDivElement, ChatHistoryProps>(
	function ChatHistory({ simplifiedChat, generatingResult, className }, ref) {
		const renderChatItems = useMemo(() => {
			if (
				simplifiedChat.length > 0 &&
				simplifiedChat.at(-1)!.type !== 'model' &&
				generatingResult
			)
				return [...simplifiedChat, emptyModelMessage];

			return simplifiedChat;
		}, [simplifiedChat, generatingResult]);

		return (
			<div ref={ref} className={classNames('appChatHistory', className)}>
				{renderChatItems.map((item, index) => {
					if (item.type === 'model')
						return (
							<ModelMessage
								key={index}
								modelMessage={item}
								active={
									index === renderChatItems.length - 1 &&
									generatingResult
								}
							/>
						);
					if (item.type === 'user')
						return <UserMessage key={index} message={item} />;

					return null;
				})}
			</div>
		);
	}
);
