import { ChevronRight } from 'lucide-react';
import prettyMilliseconds from 'pretty-ms';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '../../../MarkdownContent/MarkdownContent';
import { MessageMarkdown } from '../../../MessageMarkdown/MessageMarkdown';

import './ModelResponseThought.css';

const excerptLength = 1024;

export function ModelResponseThought({
	text,
	active,
	duration
}: ModelResponseThoughtProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = useCallback(() => {
		setIsOpen((isOpen) => !isOpen);
	}, []);

	const title = useMemo(() => {
		if (active) return 'Thinking';
		if (duration != null) {
			const formattedDuration = prettyMilliseconds(duration, {
				secondsDecimalDigits: duration < 1000 * 10 ? 2 : 0,
				verbose: true
			});
			return `Thought for ${formattedDuration}`;
		}

		return 'Finished thinking';
	}, [active, duration]);

	return (
		<div
			className={cn(
				'responseThought',
				active && 'active',
				isOpen && 'open'
			)}
		>
			<button className="header" onClick={toggleIsOpen}>
				<span className="summary">
					<div className="title">{title}</div>
					<ChevronRight className="chevron" />
				</span>
				<MarkdownContent
					className={cn('excerpt', isOpen && 'hide')}
					dir="auto"
					inline
				>
					{text.slice(-excerptLength)}
				</MarkdownContent>
			</button>
			<MessageMarkdown
				className={cn('content', !isOpen && 'hide')}
				activeDot={active}
			>
				{text}
			</MessageMarkdown>
		</div>
	);
}

type ModelResponseThoughtProps = {
	text: string;
	active: boolean;
	duration?: number;
};
