import classNames from 'classnames';
import { useMemo } from 'react';
import { MarkdownContent } from '../MarkdownContent/MarkdownContent';

import './MessageMarkdown.css';

export function MessageMarkdown({ children, activeDot = false, className }: MessageMarkdownProps) {
    const renderContent = useMemo(() => {
        if (children == null) return '';

        if (!activeDot) return children;

        const lines = children.split('\n');
        const lastLine = lines.at(-1);

        // to frequent line jumps and instability while the content is being generated,
        // wait with rendering the last line until its content is properly formed and is ready to be appended
        if (lastLine != null && ['-', '+', '*', '1.', '1', '--'].includes(lastLine.trim()))
            return lines.slice(0, -1).join('\n');
        if (
            lastLine != null &&
            lastLine.trim().length === 1 &&
            (lastLine.endsWith(' *') || lastLine.endsWith(' _') || lastLine.endsWith(' ~'))
        )
            return [...lines.slice(0, -1), lastLine.slice(0, -' _'.length)].join('\n');

        return children;
    }, [children, activeDot]);

    return (
        <MarkdownContent
            className={classNames('appMessageMarkdown', 'prose prose-neutral', activeDot && 'active', className)}
        >
            {renderContent}
        </MarkdownContent>
    );
}

type MessageMarkdownProps = {
    children?: string;
    activeDot?: boolean;
    className?: string;
};
