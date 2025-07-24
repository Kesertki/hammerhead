import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Layout from './Layout';

const renderWithRouter = (ui: React.ReactElement) => {
	return render(<HashRouter>{ui}</HashRouter>);
};

describe('Layout', () => {
	it('renders children content', () => {
		const testContent = 'Test Content';
		renderWithRouter(
			<Layout>
				<div>{testContent}</div>
			</Layout>
		);

		expect(screen.getByText(testContent)).toBeInTheDocument();
	});

	it('renders sidebar trigger button', () => {
		renderWithRouter(
			<Layout>
				<div>Test</div>
			</Layout>
		);

		expect(
			screen.getByRole('button', { name: /toggle sidebar/i })
		).toBeInTheDocument();
	});
});
