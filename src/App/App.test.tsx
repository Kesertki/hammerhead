import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
    it('renders chat interface', async () => {
        render(<App />);
        // Check for the message input textarea
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
        });
    });
});
