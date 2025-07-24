import { describe, expect, it, vi } from 'vitest';
import { eventBus } from '../utils/eventBus';

describe('EventBus', () => {
	it('should register and call event listeners', () => {
		const mockListener = vi.fn();
		const testData = { message: 'test' };

		// Register listener
		const unsubscribe = eventBus.on('test-event', mockListener);

		// Emit event
		eventBus.emit('test-event', testData);

		// Verify listener was called
		expect(mockListener).toHaveBeenCalledWith(testData);
		expect(mockListener).toHaveBeenCalledTimes(1);

		// Cleanup
		unsubscribe();
	});

	it('should unsubscribe listeners', () => {
		const mockListener = vi.fn();

		// Register and immediately unsubscribe
		const unsubscribe = eventBus.on('test-event-2', mockListener);
		unsubscribe();

		// Emit event
		eventBus.emit('test-event-2', { data: 'test' });

		// Verify listener was not called
		expect(mockListener).not.toHaveBeenCalled();
	});

	it('should handle multiple listeners for the same event', () => {
		const listener1 = vi.fn();
		const listener2 = vi.fn();
		const testData = { value: 42 };

		// Register multiple listeners
		const unsubscribe1 = eventBus.on('multi-event', listener1);
		const unsubscribe2 = eventBus.on('multi-event', listener2);

		// Emit event
		eventBus.emit('multi-event', testData);

		// Verify both listeners were called
		expect(listener1).toHaveBeenCalledWith(testData);
		expect(listener2).toHaveBeenCalledWith(testData);

		// Cleanup
		unsubscribe1();
		unsubscribe2();
	});
});
