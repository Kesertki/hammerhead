import { useState, useEffect, useCallback } from 'react';
import type { LogEntry } from '@/types';

export function useLogs() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchLogs = useCallback(async (limit?: number) => {
		if (!window.electronAPI?.getLogs) {
			setError('Log API not available');
			return;
		}

		setLoading(true);
		setError(null);
		
		try {
			const logEntries = await window.electronAPI.getLogs(limit);
			setLogs(logEntries);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch logs');
			console.error('Failed to fetch logs:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const clearLogs = useCallback(async () => {
		if (!window.electronAPI?.clearLogs) {
			setError('Log API not available');
			return;
		}

		try {
			await window.electronAPI.clearLogs();
			setLogs([]);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to clear logs');
			console.error('Failed to clear logs:', err);
		}
	}, []);

	const getLogFilePath = useCallback(async (): Promise<string | null> => {
		if (!window.electronAPI?.getLogFilePath) {
			setError('Log API not available');
			return null;
		}

		try {
			return await window.electronAPI.getLogFilePath();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to get log file path');
			console.error('Failed to get log file path:', err);
			return null;
		}
	}, []);

	useEffect(() => {
		// Initial load
		fetchLogs();
	}, [fetchLogs]);

	return {
		logs,
		loading,
		error,
		fetchLogs,
		clearLogs,
		getLogFilePath,
		refresh: () => fetchLogs()
	};
}
