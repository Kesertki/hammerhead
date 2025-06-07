import MCPConnectionsPage from '@/App/pages/McpServers.tsx';
import { Settings } from '@/App/pages/Settings.tsx';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Chat } from './Chat.tsx';
import Layout from './components/Layout.tsx';

import './App.css';

const Inbox = () => {
	return (
		<div className="p-4">
			<h1>Inbox</h1>
		</div>
	);
};

const Calendar = () => {
	return (
		<div className="p-4">
			<h1>Calendar</h1>
		</div>
	);
};

const Search = () => {
	return (
		<div className="p-4">
			<h1>Search</h1>
		</div>
	);
};

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

export function App() {
	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Chat />} />
					<Route path="/inbox" element={<Inbox />} />
					<Route path="/calendar" element={<Calendar />} />
					<Route path="/search" element={<Search />} />
					<Route path="/settings" element={<Settings />} />
					<Route path="/mcp-servers" element={<MCPConnectionsPage />} />
					<Route path="/knowledge-base" element={<KnowledgeBase />} />
				</Routes>
			</Layout>
		</Router>
	);
}
