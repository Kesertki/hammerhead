import { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import hljs from 'highlight.js';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { sanitizeSVG, isSafeSVG, unescapeSVG } from '@/utils/svgUtils';

import './SVGRenderer.css';

export function SVGRenderer({ svgContent, className }: SVGRendererProps) {
    const [showRendered, setShowRendered] = useState(true);

    const { isValid, sanitizedSVG, highlightedCode } = useMemo(() => {
        const isValid = isSafeSVG(svgContent);
        const sanitizedSVG = isValid ? sanitizeSVG(svgContent) : '';

        // Highlight SVG code as XML - use unescaped content for better display
        const unescapedContent = unescapeSVG(svgContent);
        let highlightedCode = '';
        try {
            highlightedCode = hljs.highlight(unescapedContent, { language: 'xml' }).value;
        } catch {
            // Fallback to auto-detection if XML highlighting fails
            highlightedCode = hljs.highlightAuto(unescapedContent).value;
        }

        return { isValid, sanitizedSVG, highlightedCode };
    }, [svgContent]);
    const toggleView = () => {
        setShowRendered(!showRendered);
    };

    if (!isValid) {
        return (
            <div className={`svg-renderer svg-error ${className || ''}`}>
                <p className="error-message">
                    ⚠️ SVG content contains potentially unsafe elements and cannot be rendered.
                </p>
            </div>
        );
    }

    return (
        <div className={`svg-renderer ${className || ''}`}>
            <div className="svg-controls">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={toggleView} className="svg-toggle-button">
                            {showRendered ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showRendered ? 'Show SVG code' : 'Show rendered SVG'}</TooltipContent>
                </Tooltip>
            </div>

            {showRendered ? (
                <div className="svg-content rendered" dangerouslySetInnerHTML={{ __html: sanitizedSVG }} />
            ) : (
                <pre className="svg-content code">
                    <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </pre>
            )}
        </div>
    );
}

type SVGRendererProps = {
    svgContent: string;
    className?: string;
};
