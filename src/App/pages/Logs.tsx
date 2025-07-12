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
import { LogsTestPanel } from '../components/LogsTestPanel';

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
			<Card key={`${log.timestamp}-${index}`} className="mb-2">
				<CardContent className="p-4">
					<div className="flex items-start gap-3">
						<Icon className="w-4 h-4 mt-1 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<Badge
									variant="secondary"
									className={LOG_LEVEL_COLORS[log.level]}
								>
									{log.level.toUpperCase()}
								</Badge>
								<span className="text-sm text-gray-500">
									{formatTimestamp(log.timestamp)}
								</span>
							</div>
							<div className="text-sm font-mono bg-gray-50 p-2 rounded border break-words">
								{log.message}
							</div>
							{hasStack && (
								<div className="mt-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											toggleStackTrace(log.timestamp)
										}
										className="text-xs p-1 h-auto"
									>
										{showStackTrace ? 'Hide' : 'Show'} Stack
										Trace
									</Button>
									{showStackTrace && (
										<pre className="text-xs bg-red-50 p-2 rounded border mt-1 overflow-x-auto">
											{log.stack}
										</pre>
									)}
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="h-full flex flex-col p-4 max-w-6xl mx-auto">
			<div className="mb-6 flex-shrink-0">
				<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-2">
					Application Logs
				</h1>
				<p className="text-center text-gray-600">
					View and manage application logs and console output
				</p>
			</div>

			{/* Test Panel for Development */}
			<div className="flex-shrink-0">
				<LogsTestPanel />
			</div>

			{/* Controls */}
			<Card className="mb-6 flex-shrink-0">
				<CardHeader>
					<CardTitle className="text-lg">Log Controls</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4 items-end">
						<div className="flex-1 min-w-64">
							<Label htmlFor="search">Search logs</Label>
							<Input
								id="search"
								placeholder="Search messages or timestamps..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor="level">Filter by level</Label>
							<select
								id="level"
								value={selectedLevel}
								onChange={(e) =>
									setSelectedLevel(e.target.value)
								}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

			{/* Log Display */}
			<Card className="flex-1 flex flex-col min-h-0">
				<CardHeader className="flex-shrink-0">
					<div className="flex justify-between items-center">
						<CardTitle className="text-lg">
							Log Entries ({filteredLogs.length})
						</CardTitle>
						{loading && (
							<RefreshCw className="w-4 h-4 animate-spin" />
						)}
					</div>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col min-h-0 p-4">
					{error && (
						<div className="bg-red-50 border border-red-200 rounded p-4 mb-4 flex-shrink-0">
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
						<div className="text-center py-8 text-gray-500 flex-shrink-0">
							{logs.length === 0 ? (
								<>
									<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>No logs available</p>
									<p className="text-sm">
										Logs will appear here as the application
										runs
									</p>
								</>
							) : (
								<>
									<Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>No logs match your search criteria</p>
									<p className="text-sm">
										Try adjusting your search term or level
										filter
									</p>
								</>
							)}
						</div>
					)}

					{!loading && !error && filteredLogs.length > 0 && (
						<div className="flex-1 overflow-y-auto min-h-0">
							<div className="space-y-2">
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
