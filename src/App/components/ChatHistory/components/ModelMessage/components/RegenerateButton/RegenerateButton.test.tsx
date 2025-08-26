import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegenerateButton } from './RegenerateButton';
import { SimplifiedModelChatItem } from '@/electron/state/llmState';

// Mock the RPC module
vi.mock('@/rpc/llmRpc.ts', () => ({
    electronLlmRpc: {
        regenerateMessage: vi.fn(),
    },
}));

// Mock the tooltip components
vi.mock('@/components/ui/tooltip.tsx', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="tooltip-content">{children}</div>
    ),
    TooltipTrigger: ({ asChild, children }: { asChild: boolean; children: React.ReactNode }) =>
        asChild ? children : <div data-testid="tooltip-trigger">{children}</div>,
}));

// Mock the button component
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, className, variant, disabled }: any) => (
        <button
            onClick={onClick}
            className={className}
            data-variant={variant}
            data-testid="regenerate-button"
            disabled={disabled}
        >
            {children}
        </button>
    ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('RegenerateButton', () => {
    const mockModelMessage: SimplifiedModelChatItem = {
        id: 'test-model-message-id',
        type: 'model',
        message: [
            {
                type: 'text',
                text: 'Test model response',
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the regenerate button with correct icon', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        const icon = screen.getByTestId('rotate-ccw-icon');

        expect(regenerateButton).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
    });

    it('calls regenerateMessage when clicked and not disabled', () => {
        const { electronLlmRpc } = vi.mocked(require('@/rpc/llmRpc.ts'));

        render(<RegenerateButton modelMessage={mockModelMessage} disabled={false} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        fireEvent.click(regenerateButton);

        expect(electronLlmRpc.regenerateMessage).toHaveBeenCalledTimes(1);
        expect(electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(mockModelMessage);
    });

    it('does not call regenerateMessage when disabled', () => {
        const { electronLlmRpc } = vi.mocked(require('@/rpc/llmRpc.ts'));

        render(<RegenerateButton modelMessage={mockModelMessage} disabled={true} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        fireEvent.click(regenerateButton);

        expect(electronLlmRpc.regenerateMessage).not.toHaveBeenCalled();
    });

    it('button is disabled when disabled prop is true', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} disabled={true} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        expect(regenerateButton).toBeDisabled();
    });

    it('button is not disabled when disabled prop is false', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} disabled={false} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        expect(regenerateButton).not.toBeDisabled();
    });

    it('calls regenerateMessage with the correct model message object', () => {
        const { electronLlmRpc } = vi.mocked(require('@/rpc/llmRpc.ts'));

        const customModelMessage: SimplifiedModelChatItem = {
            id: 'custom-model-id',
            type: 'model',
            message: [
                {
                    type: 'text',
                    text: 'Custom model response',
                },
            ],
        };

        render(<RegenerateButton modelMessage={customModelMessage} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        fireEvent.click(regenerateButton);

        expect(electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(customModelMessage);
    });

    it('handles multiple clicks correctly', () => {
        const { electronLlmRpc } = vi.mocked(require('@/rpc/llmRpc.ts'));

        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const regenerateButton = screen.getByTestId('regenerate-button');

        fireEvent.click(regenerateButton);
        fireEvent.click(regenerateButton);
        fireEvent.click(regenerateButton);

        expect(electronLlmRpc.regenerateMessage).toHaveBeenCalledTimes(3);
        expect(electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(mockModelMessage);
    });

    it('wraps button in tooltip structure', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const tooltip = screen.getByTestId('tooltip');
        const regenerateButton = screen.getByTestId('regenerate-button');

        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toContainElement(regenerateButton);
    });

    it('shows correct tooltip content', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const tooltipContent = screen.getByTestId('tooltip-content');
        expect(tooltipContent).toHaveTextContent('actions.regenerate');
    });
});
