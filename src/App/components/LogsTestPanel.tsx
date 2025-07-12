import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LogsTestPanel() {
	const handleTestLogs = () => {
		console.log('Test log message from Logs page');
		console.info('Test info message with detailed information');
		console.warn('Test warning message about potential issues');
		console.error('Test error message for debugging purposes');
		console.debug('Test debug message with technical details');

		// Test with complex objects
		console.log('Testing with object:', {
			user: 'test',
			action: 'log-test',
			timestamp: new Date().toISOString()
		});

		// Test with error object
		try {
			throw new Error('Test error with stack trace');
		} catch (err) {
			console.error('Caught test error:', err);
		}
	};

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="text-lg">Test Logging</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-gray-600 mb-4">
					Generate test log entries to verify the logging system is
					working correctly.
				</p>
				<Button onClick={handleTestLogs} variant="outline">
					Generate Test Logs
				</Button>
			</CardContent>
		</Card>
	);
}
