import { describe, expect, it } from 'vitest';
import { detectSVGContent, splitTextWithSVG, isSafeSVG, sanitizeSVG } from './svgUtils';

describe('SVG Utils', () => {
    describe('detectSVGContent', () => {
        it('should detect direct SVG content', () => {
            const text =
                'Here is an SVG: <svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg> and some text after.';
            const matches = detectSVGContent(text);

            expect(matches).toHaveLength(1);
            expect(matches[0]?.svg).toContain('<svg width="100" height="100">');
            expect(matches[0]?.svg).toContain('</svg>');
        });

        it('should detect SVG within code blocks', () => {
            const text = `Here's some SVG code:

\`\`\`xml
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="white" />
  <circle cx="60" cy="45" r="15" fill="black" />
  <circle cx="55" cy="55" r="5" fill="black" />
</svg>
\`\`\`

That's a simple duck!`;

            const matches = detectSVGContent(text);

            expect(matches).toHaveLength(1);
            expect(matches[0]?.svg).toContain('<svg width="100" height="100"');
            expect(matches[0]?.svg).toContain('</svg>');
        });

        it('should detect multiple SVG elements', () => {
            const text = `
            <svg><rect /></svg> and another <svg><circle /></svg>
            `;

            const matches = detectSVGContent(text);

            expect(matches).toHaveLength(2);
        });
    });

    describe('splitTextWithSVG', () => {
        it('should split text with SVG correctly', () => {
            const text = 'Before SVG <svg><rect /></svg> After SVG';
            const parts = splitTextWithSVG(text);

            expect(parts).toHaveLength(3);
            expect(parts[0]).toEqual({ type: 'text', content: 'Before SVG ' });
            expect(parts[1]).toEqual({ type: 'svg', content: '<svg><rect /></svg>' });
            expect(parts[2]).toEqual({ type: 'text', content: ' After SVG' });
        });

        it('should return single text part when no SVG', () => {
            const text = 'Just plain text here';
            const parts = splitTextWithSVG(text);

            expect(parts).toHaveLength(1);
            expect(parts[0]).toEqual({ type: 'text', content: text });
        });
    });

    describe('isSafeSVG', () => {
        it('should return true for safe SVG', () => {
            const safeSVG = '<svg><circle cx="50" cy="50" r="25" fill="blue" /></svg>';
            expect(isSafeSVG(safeSVG)).toBe(true);
        });

        it('should return false for SVG with script tags', () => {
            const unsafeSVG = '<svg><script>alert("hack")</script><circle /></svg>';
            expect(isSafeSVG(unsafeSVG)).toBe(false);
        });

        it('should return false for SVG with event handlers', () => {
            const unsafeSVG = '<svg onclick="alert(\'hack\')"><circle /></svg>';
            expect(isSafeSVG(unsafeSVG)).toBe(false);
        });
    });

    describe('sanitizeSVG', () => {
        it('should remove script tags', () => {
            const unsafeSVG = '<svg><script>alert("hack")</script><circle /></svg>';
            const sanitized = sanitizeSVG(unsafeSVG);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('<circle />');
        });

        it('should remove event handlers', () => {
            const unsafeSVG = '<svg onclick="alert(1)"><circle onmouseover="hack()" /></svg>';
            const sanitized = sanitizeSVG(unsafeSVG);

            expect(sanitized).not.toContain('onclick');
            expect(sanitized).not.toContain('onmouseover');
            expect(sanitized).toContain('<svg>');
            expect(sanitized).toContain('<circle');
        });
    });
});
