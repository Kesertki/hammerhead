import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { llmState } from '@/state/llmState.ts';
import McpServersConfig from './McpServersConfig';
import { VoicePage } from './VoicePage';

// Sub-components for different settings sections
const GeneralSettings = () => {
	const state = useExternalState(llmState);

	return (
		<div>
			<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				General Settings
			</h2>
			<p>Version: {state.appVersion}</p>
			{/* Add more general settings here */}
		</div>
	);
};

const AppearanceSettings = () => {
	return (
		<div>
			<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				Appearance
			</h2>
			<p>Configure your theme and display preferences.</p>
			{/* Add appearance settings here */}
		</div>
	);
};

const AdvancedSettings = () => {
	return (
		<div>
			<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				Advanced Settings
			</h2>
			<p>Advanced configuration options.</p>
			{/* Add advanced settings here */}
		</div>
	);
};

export function Settings() {
	const location = useLocation();

	// Navigation items for settings sections
	const settingsNavItems = [
		{
			path: '/settings/general',
			label: 'General',
			component: <GeneralSettings />
		},
		{
			path: '/settings/appearance',
			label: 'Appearance',
			component: <AppearanceSettings />
		},
		{
			path: '/settings/mcp',
			label: 'MCP Servers',
			component: <McpServersConfig />
		},
		{
			path: '/settings/voice',
			label: 'Voice',
			component: <VoicePage />
		},
		{
			path: '/settings/advanced',
			label: 'Advanced',
			component: <AdvancedSettings />
		}
	];

	return (
		<div className="p-4 h-full flex flex-col">
			{/* <h2 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-8">
				Settings
			</h2> */}

			<div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
				{/* Settings Navigation */}
				<div className="w-64 shrink-0">
					<nav className="space-y-2">
						{settingsNavItems.map((item) => (
							<Link
								key={item.path}
								to={item.path}
								className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
									location.pathname === item.path
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted'
								}`}
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>

				{/* Settings Content */}
				<div className="flex-1 min-h-0 overflow-hidden h-full">
					<Routes>
						<Route
							path="/"
							element={
								<Navigate to="/settings/general" replace />
							}
						/>
						<Route
							path="/general"
							element={
								<ScrollArea className="h-full">
									<GeneralSettings />
								</ScrollArea>
							}
						/>
						<Route
							path="/appearance"
							element={
								<ScrollArea className="h-full">
									<AppearanceSettings />
								</ScrollArea>
							}
						/>
						<Route
							path="/voice"
							element={
								<ScrollArea className="h-full">
									<VoicePage />
								</ScrollArea>
							}
						/>
						<Route
							path="/mcp"
							element={
								<div className="h-full">
									<McpServersConfig />
								</div>
							}
						/>
						<Route
							path="/advanced"
							element={
								<ScrollArea className="h-full">
									<AdvancedSettings />
								</ScrollArea>
							}
						/>
					</Routes>
				</div>
			</div>
		</div>
	);
}
