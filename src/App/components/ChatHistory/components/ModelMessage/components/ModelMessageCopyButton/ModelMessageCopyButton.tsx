import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '@/components/ui/tooltip.tsx';
import { SimplifiedModelChatItem } from '@/electron/state/llmState';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/clipboard';

import './ModelMessageCopyButton.css';

const showCopiedTime = 1000 * 2;

export function ModelMessageCopyButton({
	modelMessage
}: ModelMessageCopyButtonProps) {
	const [copies, setCopies] = useState(0);

	const onClick = useCallback(async () => {
		const text = modelMessage
			.filter((item) => item.type === 'text')
			.map((item) => item.text)
			.join('\n')
			.trim();

		try {
			const success = await copyToClipboard(text);

			if (success) {
				setCopies(copies + 1);

				setTimeout(() => {
					setCopies(copies - 1);
				}, showCopiedTime);
			} else {
				console.error('Failed to copy text to clipboard');
			}
		} catch (error) {
			console.error('Failed to copy text to clipboard', error);
		}
	}, [modelMessage, copies]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					onClick={onClick}
					variant="ghost"
					className={cn('copyButton', copies > 0 && 'copied')}
				>
					<Copy className="icon copy" />
					<Check className="icon check" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Copy</TooltipContent>
		</Tooltip>
	);
}

type ModelMessageCopyButtonProps = {
	modelMessage: SimplifiedModelChatItem['message'];
};
