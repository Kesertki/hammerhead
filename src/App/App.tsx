import { Button } from '@/components/ui/button';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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

const Settings = () => {
	return (
		<div className="p-4">
			<h1>Settings</h1>
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
				</Routes>
			</Layout>
		</Router>
	);
}
