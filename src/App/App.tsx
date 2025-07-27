import { useEffect } from 'react';
import {
	Route,
	HashRouter as Router,
	Routes,
	useNavigate
} from 'react-router-dom';
import McpServersConfig from '@/App/pages/McpServersConfig.tsx';
import { Chat } from './Chat.tsx';
import Layout from './components/Layout.tsx';
import { Settings } from './pages/Settings.tsx';
import SystemPrompt from './pages/SystemPrompt.tsx';

import './App.css';
import { ModelSelector } from './components/ModelSelector.tsx';
import { Logs } from './pages/Logs.tsx';

const KnowledgeBase = () => {
	return (
		<div className="p-4">
			<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
				Knowledge Base
			</h1>
			<p>Access your knowledge base here.</p>
		</div>
	);
};

const PlaceholderPage = ({ title }: { title: string }) => {
	return (
		<div className="p-4">
			<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
				{title}
			</h1>
			<p>This is a placeholder page.</p>
		</div>
	);
};

function NavigationHandler() {
	const navigate = useNavigate();

	useEffect(() => {
		// Set up the electron navigation listener
		if (window.electronAPI?.onNavigateToRoute) {
			window.electronAPI.onNavigateToRoute((route: string) => {
				navigate(route);
			});
		}
	}, [navigate]);

	return null;
}

export function App() {
	return (
		<Router>
			<NavigationHandler />
			<Layout>
				<Routes>
					<Route path="/" element={<Chat />} />
					<Route path="/settings/*" element={<Settings />} />
					<Route path="/mcp-servers" element={<McpServersConfig />} />
					<Route path="/knowledge-base" element={<KnowledgeBase />} />
					<Route
						path="/assistants"
						element={<PlaceholderPage title="Assistants" />}
					/>
					<Route
						path="/models"
						element={
							<div className="p-4">
								<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-8">
									Models
								</h1>
								<ModelSelector />
							</div>
						}
					/>
					<Route path="/system-prompt" element={<SystemPrompt />} />
					<Route path="/logs" element={<Logs />} />
				</Routes>
			</Layout>
		</Router>
	);
}
