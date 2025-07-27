import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
	it('renders React app', async () => {
		render(<App />);
		// Check for the sidebar navigation which should always be present
		await waitFor(() => {
			expect(screen.getByText('Assistant')).toBeInTheDocument();
		});
	});

	it('renders main navigation links', async () => {
		render(<App />);
		// Wait for the app to render and check for key navigation elements
		await waitFor(() => {
			expect(screen.getByText('Assistant')).toBeInTheDocument();
			// expect(screen.getByText('MCP Servers')).toBeInTheDocument();
			// expect(
			// 	screen.getByText('Knowledge Base')
			// ).toBeInTheDocument();
			// expect(screen.getByText('System Prompt')).toBeInTheDocument();
			// expect(screen.getByText('Voice')).toBeInTheDocument();
		});
	});

	it('renders chat interface', async () => {
		render(<App />);
		// Check for the message input textarea
		await waitFor(() => {
			expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
		});
	});
});
