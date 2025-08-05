/**
 * Utility functions for detecting and handling SVG content in text
 */

export interface SVGContent {
    svg: string;
    startIndex: number;
    endIndex: number;
}

/**
 * Detects SVG content in text using regex, including within code blocks
 */
export function detectSVGContent(text: string): SVGContent[] {
    const matches: SVGContent[] = [];

    // SVG within code blocks (```xml, ```svg, or just ```)
    const codeBlockRegex = /```(?:xml|svg)?\s*\n([\s\S]*?)\n```/gi;
    let codeBlockMatch: RegExpExecArray | null;

    while ((codeBlockMatch = codeBlockRegex.exec(text)) !== null) {
        const codeBlockContent = codeBlockMatch[1];
        if (!codeBlockContent) continue;

        const svgInCodeRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
        let svgMatch: RegExpExecArray | null;

        while ((svgMatch = svgInCodeRegex.exec(codeBlockContent)) !== null) {
            matches.push({
                svg: svgMatch[0],
                startIndex: codeBlockMatch.index, // Replace entire code block
                endIndex: codeBlockMatch.index + codeBlockMatch[0].length,
            });
        }
    }

    // Direct SVG tags in text (not in code blocks)
    const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
    let svgMatch: RegExpExecArray | null;

    while ((svgMatch = svgRegex.exec(text)) !== null) {
        // Check if this SVG is already captured in a code block
        const isInCodeBlock = matches.some(
            (existing) => svgMatch!.index >= existing.startIndex && svgMatch!.index < existing.endIndex
        );

        if (!isInCodeBlock) {
            matches.push({
                svg: svgMatch[0],
                startIndex: svgMatch.index,
                endIndex: svgMatch.index + svgMatch[0].length,
            });
        }
    }

    // Sort by start index to maintain order
    return matches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Splits text into parts with SVG content separated
 */
export function splitTextWithSVG(text: string): Array<{ type: 'text' | 'svg'; content: string }> {
    const svgMatches = detectSVGContent(text);

    if (svgMatches.length === 0) {
        return [{ type: 'text', content: text }];
    }

    const parts: Array<{ type: 'text' | 'svg'; content: string }> = [];
    let lastIndex = 0;

    svgMatches.forEach((match) => {
        // Add text before SVG
        if (match.startIndex > lastIndex) {
            const textContent = text.slice(lastIndex, match.startIndex);
            if (textContent.trim()) {
                parts.push({ type: 'text', content: textContent });
            }
        }

        // Add SVG content
        parts.push({ type: 'svg', content: match.svg });
        lastIndex = match.endIndex;
    });

    // Add remaining text after last SVG
    if (lastIndex < text.length) {
        const textContent = text.slice(lastIndex);
        if (textContent.trim()) {
            parts.push({ type: 'text', content: textContent });
        }
    }

    return parts;
}

/**
 * Validates if SVG content is safe to render
 */
export function isSafeSVG(svgContent: string): boolean {
    // Basic safety checks - remove script tags and event handlers
    const dangerousPatterns = [
        /<script[\s\S]*?<\/script>/gi,
        /on\w+\s*=/gi, // event handlers like onclick, onload, etc.
        /javascript:/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(svgContent));
}

/**
 * Sanitizes SVG content by removing potentially dangerous elements
 */
export function sanitizeSVG(svgContent: string): string {
    // Remove script tags
    let sanitized = svgContent.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Remove event handlers (both quoted and unquoted)
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '');

    // Remove javascript: and vbscript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');

    return sanitized;
}
