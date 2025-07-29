/**
 * Utility functions for clipboard operations with fallback support
 */

/**
 * Copy text to clipboard with fallback methods
 * @param text - The text to copy
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    // Ensure the window has focus (helps with permission issues)
    if (document.hasFocus && !document.hasFocus()) {
        window.focus();
    }

    // Try modern clipboard API first - should work fine in Electron renderer
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Clipboard API failed, trying fallback:', error);
            // Continue to fallback method
        }
    }

    // Fallback to older method using execCommand
    try {
        return copyToClipboardFallback(text);
    } catch (error) {
        console.error('All clipboard methods failed:', error);
        return false;
    }
}

/**
 * Fallback clipboard copy using document.execCommand
 * @param text - The text to copy
 * @returns boolean - Returns true if successful, false otherwise
 */
function copyToClipboardFallback(text: string): boolean {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;

    // Position it off-screen but make sure it's focusable
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('tabindex', '-1');

    document.body.appendChild(textarea);

    try {
        // Focus the textarea and select the text
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        // Try to copy using execCommand
        const successful = document.execCommand('copy');

        return successful;
    } catch (error) {
        console.error('execCommand copy failed:', error);
        return false;
    } finally {
        // Clean up - remove the element
        document.body.removeChild(textarea);
    }
}

/**
 * Check if clipboard write is available
 * @returns boolean - Returns true if clipboard write is supported
 */
export function isClipboardWriteSupported(): boolean {
    return !!((navigator.clipboard && navigator.clipboard.writeText) || document.execCommand);
}
