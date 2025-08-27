import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegenerateButton } from './RegenerateButton';
import { SimplifiedModelChatItem } from '@/electron/state/llmState';
import * as llmRpc from '@/rpc/llmRpc.ts';
import * as eventBusModule from '@/utils/eventBus.ts';

// Mock the RPC module
vi.mock('@/rpc/llmRpc.ts', () => ({
    electronLlmRpc: {
        regenerateMessage: vi.fn(),
    },
}));

// Mock the event bus
vi.mock('@/utils/eventBus.ts', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
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
        vi.restoreAllMocks();
    });

    it('renders the regenerate button with correct icon', () => {
        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        const icon = screen.getByTestId('rotate-ccw-icon');

        expect(regenerateButton).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
    });

    it('calls regenerateMessage and emits event when clicked and not disabled', () => {
        const llmRpcModule = vi.mocked(llmRpc);
        const eventBusModuleMocked = vi.mocked(eventBusModule);

        render(<RegenerateButton modelMessage={mockModelMessage} disabled={false} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        fireEvent.click(regenerateButton);

        expect(eventBusModuleMocked.eventBus.emit).toHaveBeenCalledTimes(1);
        expect(eventBusModuleMocked.eventBus.emit).toHaveBeenCalledWith('message-regenerated', {
            modelMessage: mockModelMessage,
        });
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).toHaveBeenCalledTimes(1);
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(mockModelMessage);
    });

    it('does not call regenerateMessage or emit event when disabled', () => {
        const llmRpcModule = vi.mocked(llmRpc);
        const eventBusModuleMocked = vi.mocked(eventBusModule);

        render(<RegenerateButton modelMessage={mockModelMessage} disabled={true} />);

        const regenerateButton = screen.getByTestId('regenerate-button');
        fireEvent.click(regenerateButton);

        expect(eventBusModuleMocked.eventBus.emit).not.toHaveBeenCalled();
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).not.toHaveBeenCalled();
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
        const llmRpcModule = vi.mocked(llmRpc);
        const eventBusModuleMocked = vi.mocked(eventBusModule);

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

        expect(eventBusModuleMocked.eventBus.emit).toHaveBeenCalledWith('message-regenerated', {
            modelMessage: customModelMessage,
        });
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(customModelMessage);
    });

    it('handles multiple clicks correctly', () => {
        const llmRpcModule = vi.mocked(llmRpc);
        const eventBusModuleMocked = vi.mocked(eventBusModule);

        render(<RegenerateButton modelMessage={mockModelMessage} />);

        const regenerateButton = screen.getByTestId('regenerate-button');

        fireEvent.click(regenerateButton);
        fireEvent.click(regenerateButton);
        fireEvent.click(regenerateButton);

        expect(eventBusModuleMocked.eventBus.emit).toHaveBeenCalledTimes(3);
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).toHaveBeenCalledTimes(3);
        expect(llmRpcModule.electronLlmRpc.regenerateMessage).toHaveBeenCalledWith(mockModelMessage);
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
