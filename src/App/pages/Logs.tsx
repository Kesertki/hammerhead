import {
	AlertCircle,
	AlertTriangle,
	Bug,
	Download,
	FileText,
	Info,
	RefreshCw,
	Search,
	Trash2
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLogs } from '@/hooks/useLogs';
import { LogEntry } from '@/types';

const LOG_LEVEL_COLORS = {
	log: 'bg-gray-100 text-gray-800',
	info: 'bg-blue-100 text-blue-800',
	warn: 'bg-yellow-100 text-yellow-800',
	error: 'bg-red-100 text-red-800',
	debug: 'bg-purple-100 text-purple-800'
} as const;

const LOG_LEVEL_ICONS = {
	log: FileText,
	info: Info,
	warn: AlertTriangle,
	error: AlertCircle,
	debug: Bug
} as const;

export function Logs() {
	const { logs, loading, error, clearLogs, getLogFilePath, refresh } =
		useLogs();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedLevel, setSelectedLevel] = useState<string>('all');
	const [showStack, setShowStack] = useState<{ [key: string]: boolean }>({});
	const [showControls, setShowControls] = useState(false);

	const filteredLogs = logs.filter((log) => {
		const matchesSearch =
			!searchTerm ||
			log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.timestamp.includes(searchTerm);
		const matchesLevel =
			selectedLevel === 'all' || log.level === selectedLevel;
		return matchesSearch && matchesLevel;
	});

	const handleClearLogs = async () => {
		if (
			window.confirm(
				'Are you sure you want to clear all logs? This action cannot be undone.'
			)
		) {
			await clearLogs();
		}
	};

	const handleDownloadLogs = async () => {
		const logFilePath = await getLogFilePath();
		if (logFilePath) {
			// In a real electron app, you might want to show a save dialog
			// For now, we'll show the path to the user
			alert(`Log file location: ${logFilePath}`);
		}
	};

	const toggleStackTrace = (timestamp: string) => {
		setShowStack((prev) => ({
			...prev,
			[timestamp]: !prev[timestamp]
		}));
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	const renderLogEntry = (log: LogEntry, index: number) => {
		const Icon = LOG_LEVEL_ICONS[log.level];
		const hasStack = log.stack && log.stack.length > 0;
		const showStackTrace = showStack[log.timestamp] || false;

		return (
			<div
				key={`${log.timestamp}-${index}`}
				className="border-b border-gray-100 py-2 px-3 hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-start gap-3">
					<Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<Badge
								variant="secondary"
								className={`${LOG_LEVEL_COLORS[log.level]} text-xs px-2 py-0.5`}
							>
								{log.level.toUpperCase()}
							</Badge>
							<span className="text-xs text-gray-500">
								{formatTimestamp(log.timestamp)}
							</span>
						</div>
						<div className="text-sm font-mono bg-gray-50 p-2 rounded text-gray-800 break-words">
							{log.message}
						</div>
						{hasStack && (
							<div className="mt-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										toggleStackTrace(log.timestamp)
									}
									className="text-xs p-1 h-auto text-gray-600 hover:text-gray-900"
								>
									{showStackTrace ? 'Hide' : 'Show'} Stack
									Trace
								</Button>
								{showStackTrace && (
									<pre className="text-xs bg-red-50 p-2 rounded border mt-1 overflow-x-auto text-red-800">
										{log.stack}
									</pre>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="h-full flex flex-col max-w-6xl mx-auto p-4">
			<div className="mb-4 flex-shrink-0">
				<h1 className="text-center text-3xl font-bold tracking-tight mb-1">
					Application Logs
				</h1>
				<p className="text-center text-gray-600 text-sm">
					View and manage application logs and console output
				</p>
			</div>

			{/* Toggle Button */}
			<div className="mb-4 flex-shrink-0 flex justify-between items-center">
				<div className="flex items-center gap-2">
					<Search className="w-4 h-4 text-gray-500" />
					<span className="text-sm font-medium">Search & Filter</span>
					{!showControls &&
						(searchTerm || selectedLevel !== 'all') && (
							<Badge variant="secondary" className="text-xs">
								Active
							</Badge>
						)}
				</div>
				<Button
					onClick={() => setShowControls(!showControls)}
					variant="ghost"
					size="sm"
					className="text-xs"
				>
					{showControls ? 'Hide' : 'Show'}
				</Button>
			</div>

			{/* Controls */}
			{showControls && (
				<Card className="mb-4 flex-shrink-0">
					<CardContent className="p-4">
						<div className="flex flex-wrap gap-4 items-end">
							<div className="flex-1 min-w-64">
								<Label htmlFor="search" className="text-sm">
									Search logs
								</Label>
								<Input
									id="search"
									placeholder="Search messages or timestamps..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="mt-1 h-9"
								/>
							</div>
							<div>
								<Label htmlFor="level" className="text-sm">
									Filter by level
								</Label>
								<select
									id="level"
									value={selectedLevel}
									onChange={(e) =>
										setSelectedLevel(e.target.value)
									}
									className="mt-1 block w-full px-3 py-2 h-9 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
								>
									<option value="all">All levels</option>
									<option value="log">Log</option>
									<option value="info">Info</option>
									<option value="warn">Warning</option>
									<option value="error">Error</option>
									<option value="debug">Debug</option>
								</select>
							</div>
							<div className="flex gap-2">
								<Button
									onClick={refresh}
									disabled={loading}
									size="sm"
									variant="outline"
								>
									<RefreshCw className="w-4 h-4 mr-2" />
									Refresh
								</Button>
								<Button
									onClick={handleDownloadLogs}
									size="sm"
									variant="outline"
								>
									<Download className="w-4 h-4 mr-2" />
									Log File
								</Button>
								<Button
									onClick={handleClearLogs}
									size="sm"
									variant="destructive"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Clear
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Log Display */}
			<Card className="flex-1 flex flex-col min-h-0">
				<CardHeader className="flex-shrink-0 pb-4">
					<div className="flex justify-between items-center">
						<CardTitle className="text-lg">
							Log Entries ({filteredLogs.length})
						</CardTitle>
						{loading && (
							<RefreshCw className="w-4 h-4 animate-spin" />
						)}
					</div>
				</CardHeader>
				<CardContent className="flex-1 min-h-0 pt-0">
					{error && (
						<div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
							<div className="flex items-center gap-2 text-red-800">
								<AlertCircle className="w-4 h-4" />
								<span className="font-medium">
									Error loading logs
								</span>
							</div>
							<p className="text-red-700 mt-1">{error}</p>
						</div>
					)}

					{!loading && !error && filteredLogs.length === 0 && (
						<div className="h-64 flex items-center justify-center text-center text-gray-500">
							{logs.length === 0 ? (
								<div>
									<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>No logs available</p>
									<p className="text-sm">
										Logs will appear here as the application
										runs
									</p>
								</div>
							) : (
								<div>
									<Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>No logs match your search criteria</p>
									<p className="text-sm">
										Try adjusting your search term or level
										filter
									</p>
								</div>
							)}
						</div>
					)}

					{!loading && !error && filteredLogs.length > 0 && (
						<div className="h-full overflow-y-auto border rounded">
							<div className="divide-y divide-gray-100">
								{filteredLogs.map((log, index) =>
									renderLogEntry(log, index)
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
