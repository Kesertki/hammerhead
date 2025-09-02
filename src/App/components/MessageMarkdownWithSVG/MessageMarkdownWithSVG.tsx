import classNames from 'classnames';
import { useMemo } from 'react';
import { MarkdownContent } from '../MarkdownContent/MarkdownContent';
import { SVGRenderer } from '../SVGRenderer/SVGRenderer';
import { splitTextWithSVG } from '@/utils/svgUtils';

import './MessageMarkdownWithSVG.css';

export function MessageMarkdownWithSVG({ children, activeDot = false, className }: MessageMarkdownWithSVGProps) {
    const { processedContent, hasSVG } = useMemo(() => {
        if (children == null) return { processedContent: '', hasSVG: false };

        let content = children;

        if (activeDot) {
            const lines = content.split('\n');
            const lastLine = lines.at(-1);

            // Handle active dot logic from original MessageMarkdown
            if (lastLine != null && ['-', '+', '*', '1.', '1', '--'].includes(lastLine.trim()))
                content = lines.slice(0, -1).join('\n');
            if (
                lastLine != null &&
                lastLine.trim().length === 1 &&
                (lastLine.endsWith(' *') || lastLine.endsWith(' _') || lastLine.endsWith(' ~'))
            )
                content = [...lines.slice(0, -1), lastLine.slice(0, -' _'.length)].join('\n');
        }

        const parts = splitTextWithSVG(content);
        const hasSVG = parts.some((part) => part.type === 'svg');

        return { processedContent: parts, hasSVG };
    }, [children, activeDot]);

    if (!hasSVG) {
        // If no SVG content, use the original MessageMarkdown behavior
        return (
            <MarkdownContent
                className={classNames(
                    'appMessageMarkdown',
                    'prose prose-neutral dark:prose-invert',
                    activeDot && 'active',
                    className
                )}
            >
                {typeof processedContent === 'string' ? processedContent : children || ''}
            </MarkdownContent>
        );
    }

    // If SVG content is detected, render mixed content
    return (
        <div
            className={classNames(
                'appMessageMarkdown',
                'prose prose-neutral dark:prose-invert',
                activeDot && 'active',
                className
            )}
        >
            {Array.isArray(processedContent) &&
                processedContent.map((part, index) => {
                    if (part.type === 'svg') {
                        return <SVGRenderer key={`svg-${index}`} svgContent={part.content} className="message-svg" />;
                    } else {
                        return (
                            <MarkdownContent key={`text-${index}`} className="message-text-part">
                                {part.content}
                            </MarkdownContent>
                        );
                    }
                })}
        </div>
    );
}

type MessageMarkdownWithSVGProps = {
    children?: string;
    activeDot?: boolean;
    className?: string;
};
