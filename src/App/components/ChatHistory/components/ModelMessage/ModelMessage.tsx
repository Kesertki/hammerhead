import { Timer } from 'lucide-react';
import { SimplifiedModelChatItem } from '@/electron/state/llmState.ts';
import { MessageMarkdown } from '../../../MessageMarkdown/MessageMarkdown.tsx';
import { ModelResponseThought } from '../ModelResponseThought/ModelResponseThought.tsx';
import { ModelMessageCopyButton } from './components/ModelMessageCopyButton/ModelMessageCopyButton.tsx';

import './ModelMessage.css';

export function ModelMessage({ modelMessage, active }: ModelMessageProps) {
	return (
		<div className="message model">
			{modelMessage.message.map((message, responseIndex) => {
				const isLastMessage =
					responseIndex === modelMessage.message.length - 1;

				if (
					message.type === 'segment' &&
					message.segmentType === 'thought'
				) {
					return (
						<ModelResponseThought
							key={responseIndex}
							text={message.text}
							active={isLastMessage && active}
							duration={
								message.startTime != null &&
								message.endTime != null
									? new Date(message.endTime).getTime() -
										new Date(message.startTime).getTime()
									: undefined
							}
						/>
					);
				}

				return (
					<MessageMarkdown
						key={responseIndex}
						activeDot={isLastMessage && active}
						className="text"
					>
						{message.text}
					</MessageMarkdown>
				);
			})}
			{modelMessage.message.length === 0 && active && (
				<MessageMarkdown className="text" activeDot />
			)}
			<div className="buttons items-center" inert={active}>
				<ModelMessageCopyButton modelMessage={modelMessage.message} />

				<div className="flex items-center">
					<Timer className="w-4 h-4 ml-2 mr-1" />
					<span className="text-xs text-muted-foreground">
						{Math.round(
							modelMessage.performanceStats
								?.outputTokensPerSecond || 0
						)}{' '}
						tokens/sec
					</span>
				</div>
			</div>
		</div>
	);
}

type ModelMessageProps = {
	modelMessage: SimplifiedModelChatItem;
	active: boolean;
};
