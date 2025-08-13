import { ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatDurationPositive } from '@/utils/timeUtils';
import { MarkdownContent } from '../../../MarkdownContent/MarkdownContent';
import { MessageMarkdown } from '../../../MessageMarkdown/MessageMarkdown';

import './ModelResponseThought.css';

const excerptLength = 1024;

export function ModelResponseThought({ text, active, duration }: ModelResponseThoughtProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const toggleIsOpen = useCallback(() => {
        setIsOpen((isOpen) => !isOpen);
    }, []);

    const title = useMemo(() => {
        if (active) return t('model_response.thinking');
        if (duration != null) {
            const formattedDuration = formatDurationPositive(duration, i18n.language);
            return t('model_response.thought_for', { duration: formattedDuration });
        }

        return t('model_response.finished_thinking');
    }, [active, duration, i18n.language, t]);

    return (
        <div className={cn('responseThought', active && 'active', isOpen && 'open')}>
            <button className="header" onClick={toggleIsOpen}>
                <span className="summary">
                    <div className="title">{title}</div>
                    <ChevronRight className="chevron" />
                </span>
                <MarkdownContent className={cn('excerpt', isOpen && 'hide')} dir="auto" inline>
                    {text.slice(-excerptLength)}
                </MarkdownContent>
            </button>
            <MessageMarkdown className={cn('content', !isOpen && 'hide')} activeDot={active}>
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
