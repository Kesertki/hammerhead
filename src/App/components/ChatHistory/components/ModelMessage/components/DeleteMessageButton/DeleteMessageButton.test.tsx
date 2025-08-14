import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DeleteMessageButton } from './DeleteMessageButton';
import { SimplifiedUserChatItem } from '@/electron/state/llmState';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';

// Mock the electronLlmRpc
vi.mock('@/rpc/llmRpc.ts', () => ({
    electronLlmRpc: {
        deleteMessage: vi.fn(),
    },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
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
    Button: ({ children, onClick, className, variant }: any) => (
        <button onClick={onClick} className={className} data-variant={variant} data-testid="delete-button">
            {children}
        </button>
    ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Trash2: () => <div data-testid="trash-icon">Trash2</div>,
}));

describe('DeleteMessageButton', () => {
    const mockMessage: SimplifiedUserChatItem = {
        id: 'test-message-id',
        type: 'user',
        message: 'Test message content',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders delete button with trash icon', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const deleteButton = screen.getByTestId('delete-button');
        const trashIcon = screen.getByTestId('trash-icon');

        expect(deleteButton).toBeInTheDocument();
        expect(trashIcon).toBeInTheDocument();
    });

    it('renders with correct button variant and class', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const deleteButton = screen.getByTestId('delete-button');

        expect(deleteButton).toHaveAttribute('data-variant', 'ghost');
        expect(deleteButton).toHaveClass('deleteButton');
    });

    it('renders tooltip with delete action text', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const tooltipContent = screen.getByTestId('tooltip-content');

        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent).toHaveTextContent('actions.delete');
    });

    it('calls electronLlmRpc.deleteMessage when button is clicked', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const deleteButton = screen.getByTestId('delete-button');
        fireEvent.click(deleteButton);

        expect(electronLlmRpc.deleteMessage).toHaveBeenCalledTimes(1);
        expect(electronLlmRpc.deleteMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('calls deleteMessage with the correct message object', () => {
        const customMessage: SimplifiedUserChatItem = {
            id: 'custom-id',
            type: 'user',
            message: 'Custom message',
        };

        render(<DeleteMessageButton message={customMessage} />);

        const deleteButton = screen.getByTestId('delete-button');
        fireEvent.click(deleteButton);

        expect(electronLlmRpc.deleteMessage).toHaveBeenCalledWith(customMessage);
    });

    it('handles multiple clicks correctly', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const deleteButton = screen.getByTestId('delete-button');

        fireEvent.click(deleteButton);
        fireEvent.click(deleteButton);
        fireEvent.click(deleteButton);

        expect(electronLlmRpc.deleteMessage).toHaveBeenCalledTimes(3);
        expect(electronLlmRpc.deleteMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('wraps button in tooltip structure', () => {
        render(<DeleteMessageButton message={mockMessage} />);

        const tooltip = screen.getByTestId('tooltip');
        const deleteButton = screen.getByTestId('delete-button');

        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toContainElement(deleteButton);
    });
});
