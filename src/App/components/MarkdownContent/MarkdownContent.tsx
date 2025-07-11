import hljs from 'highlight.js';
import { Check, Copy } from 'lucide-react';
import markdownit from 'markdown-it';
import React, { useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';

import 'highlight.js/styles/github-dark.css';
import './MarkdownContent.css';

const md = markdownit({
	highlight(str, lang): string {
		if (hljs.getLanguage(lang) != null) {
			try {
				return hljs.highlight(str, { language: lang }).value;
			} catch {
				// do nothing
			}
		}

		return hljs.highlightAuto(str).value;
	}
});

// Copy Button Component
const CopyButton = ({ code }: { code: string }) => {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button
			size="sm"
			variant="ghost"
			onClick={handleCopy}
			className="code-copy-button"
		>
			{copied ? <Check size={16} /> : <Copy size={16} />}
			<span>{copied ? 'Copied' : 'Copy'}</span>
		</Button>
	);
};

export function MarkdownContent({
	children,
	inline = false,
	dir,
	className
}: MarkdownContentProps) {
	const divRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (divRef.current == null) return;

		// Render markdown content
		if (inline) divRef.current.innerHTML = md.renderInline(children ?? '');
		else divRef.current.innerHTML = md.render(children ?? '');

		// Add click handler for external links
		const handleLinkClick = (event: Event) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'A') {
				const href = (target as HTMLAnchorElement).href;
				if (
					href &&
					(href.startsWith('http://') || href.startsWith('https://'))
				) {
					event.preventDefault();
					// Check if we're in Electron environment
					if (window.electronAPI?.openExternal) {
						window.electronAPI.openExternal(href);
					} else {
						// Fallback for non-Electron environments
						window.open(href, '_blank');
					}
				}
			}
		};

		// Add event listener for link clicks
		divRef.current.addEventListener('click', handleLinkClick);

		// Add copy buttons to code blocks
		if (!inline) {
			const codeBlocks = divRef.current.querySelectorAll('pre code');
			codeBlocks.forEach((codeBlock) => {
				// Create container for the code block with relative positioning
				const container = document.createElement('div');
				container.className = 'code-block-container';

				// Create button container div
				const buttonContainer = document.createElement('div');
				buttonContainer.className = 'copy-button-container';

				// Get the code content
				const code = codeBlock.textContent || '';

				// Get the parent pre element
				const preElement = codeBlock.parentElement;
				if (preElement && preElement.tagName === 'PRE') {
					// Wrap the pre element with our container
					preElement.parentNode?.insertBefore(container, preElement);
					container.appendChild(preElement);

					// Add the button container
					container.appendChild(buttonContainer);

					// Render the React button component into the button container
					const root = createRoot(buttonContainer);
					root.render(<CopyButton code={code} />);
				}
			});
		}

		// Cleanup function
		return () => {
			divRef.current?.removeEventListener('click', handleLinkClick);
		};
	}, [inline, children]);

	return <div className={className} ref={divRef} dir={dir} />;
}

type MarkdownContentProps = {
	className?: string;
	inline?: boolean;
	dir?: string;
	children: string;
};
