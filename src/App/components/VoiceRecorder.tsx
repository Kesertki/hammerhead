import { Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
	durationLimit?: number; // in seconds
	showLabels?: boolean; // Whether to show labels on buttons
	showPlayer?: boolean; // Whether to show the audio player after recording
	onRecordingComplete?: (
		blob: Blob,
		duration: number
	) => void | Promise<void | string>; // Callback when recording is complete
};

export function VoiceRecorder({
	durationLimit = 10,
	showLabels = false,
	showPlayer = true,
	onRecordingComplete
}: Props) {
	const [isRecording, setIsRecording] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [fallbackAvailable, setFallbackAvailable] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);

	const chunks = useRef<Blob[]>([]);
	const interval = useRef<NodeJS.Timeout | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const elapsedTimeRef = useRef<number>(0);

	useEffect(() => {
		setFallbackAvailable(
			typeof navigator === 'undefined' ||
				!navigator.mediaDevices ||
				typeof MediaRecorder === 'undefined'
		);
	}, []);

	// Cleanup function to properly stop all recording resources
	const cleanupRecording = useCallback(() => {
		// Clear timers first
		if (interval.current) {
			clearInterval(interval.current);
			interval.current = null;
		}

		// Stop media recorder if active
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state === 'recording'
		) {
			mediaRecorderRef.current.stop();
		}

		// Stop all media stream tracks
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanupRecording();
			// Also cleanup blob URL to prevent memory leaks
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [cleanupRecording, audioUrl]);

	const getMimeType = () => {
		// Test MIME types in order of preference
		const types = [
			'audio/webm;codecs=opus',
			'audio/webm',
			'audio/mp4',
			'audio/ogg;codecs=opus',
			'audio/ogg'
		];

		for (const type of types) {
			if (MediaRecorder.isTypeSupported(type)) {
				console.log('Using MIME type:', type);
				return type;
			}
		}

		console.log(
			'No supported MIME type found, using default (empty string)'
		);
		return '';
	};

	// Check microphone permissions
	const checkMicrophonePermission = async () => {
		try {
			// Check if navigator.permissions is available
			if (navigator.permissions && navigator.permissions.query) {
				const permissionStatus = await navigator.permissions.query({
					name: 'microphone' as PermissionName
				});
				console.log(
					'Microphone permission status:',
					permissionStatus.state
				);
				return permissionStatus.state === 'granted';
			}

			// Fallback: try to access microphone directly
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});
			stream.getTracks().forEach((track) => track.stop()); // Clean up test stream
			return true;
		} catch (error) {
			console.log('Microphone permission check failed:', error);
			return false;
		}
	};

	const startRecording = async () => {
		try {
			// Check microphone permissions first
			const hasPermission = await checkMicrophonePermission();
			if (!hasPermission) {
				toast.error(
					'Microphone permission is required. Please allow microphone access and try again.'
				);
				return;
			}

			// Clean up any existing recording first
			cleanupRecording();

			// Reset audio URL and blob for new recording
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
			setAudioUrl(null);
			setElapsedTime(0);
			elapsedTimeRef.current = 0;

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 44100, // CD-quality audio
					channelCount: 1, // Mono recording for better compatibility
					echoCancellation: true, // Enable echo cancellation
					noiseSuppression: true, // Enable noise suppression
					autoGainControl: true // Enable automatic gain control
				}
			});
			streamRef.current = stream;

			console.log(
				'Audio stream obtained:',
				stream.getAudioTracks()[0]?.getSettings()
			);

			const mimeType = getMimeType();
			console.log('Using MIME type for recording:', mimeType);

			const recorder = new MediaRecorder(
				stream,
				mimeType
					? { mimeType, audioBitsPerSecond: 128000 }
					: { audioBitsPerSecond: 128000 }
			);
			mediaRecorderRef.current = recorder;
			chunks.current = [];

			recorder.ondataavailable = (e) => {
				console.log('Data available, size:', e.data.size);
				if (e.data.size > 0) {
					chunks.current.push(e.data);
				}
			};

			recorder.onstop = () => {
				const currentElapsed = elapsedTimeRef.current;
				console.log(
					'Recorder stopped, elapsed time:',
					currentElapsed,
					'chunks:',
					chunks.current.length
				);

				if (chunks.current.length > 0) {
					// First revoke any existing URL
					if (audioUrl) {
						URL.revokeObjectURL(audioUrl);
					}

					const audioBlob = new Blob(chunks.current, {
						type: mimeType || 'audio/webm'
					});

					console.log('Blob created:', {
						size: audioBlob.size,
						type: audioBlob.type,
						chunks: chunks.current.length,
						recordingDuration: currentElapsed
					});

					// Create URL after blob is fully ready
					const newAudioUrl = URL.createObjectURL(audioBlob);

					// Update state
					setAudioUrl(newAudioUrl);

					// Call the callback with the blob and duration (handle async callbacks)
					try {
						const result = onRecordingComplete?.(
							audioBlob,
							currentElapsed
						);
						if (result && typeof result.then === 'function') {
							result.catch((error) => {
								console.error(
									'Error in recording callback:',
									error
								);
							});
						}
					} catch (error) {
						console.error('Error in recording callback:', error);
					}
				} else {
					console.error('No audio chunks recorded!');
					toast.error('No audio was recorded. Please try again.');
				}
			};

			recorder.onerror = (event) => {
				console.error('MediaRecorder error:', event);
				toast.error('Recording error occurred.');
			};

			// Start recording
			recorder.start(1000); // Request data every 1 second for better reliability
			setIsRecording(true);
			setElapsedTime(0);
			elapsedTimeRef.current = 0;

			console.log('Recording started');

			// Start timer for elapsed time
			if (interval.current) {
				clearInterval(interval.current);
			}
			interval.current = setInterval(() => {
				setElapsedTime((prev) => {
					const nextValue = prev + 1;
					// Update the ref as well
					elapsedTimeRef.current = nextValue;
					// Auto-stop when duration limit is reached
					if (nextValue >= durationLimit) {
						stopRecording();
						return durationLimit; // Cap at duration limit
					}
					return nextValue;
				});
			}, 1000);
		} catch (err) {
			console.error('Microphone access denied or not available.', err);

			// Provide more specific error messages
			if (err instanceof DOMException) {
				switch (err.name) {
					case 'NotAllowedError':
						toast.error(
							'Microphone permission denied. Please allow microphone access in your browser or system settings.'
						);
						break;
					case 'NotFoundError':
						toast.error(
							'No microphone found. Please connect a microphone and try again.'
						);
						break;
					case 'NotReadableError':
						toast.error(
							'Microphone is already in use by another application.'
						);
						break;
					default:
						toast.error(`Microphone error: ${err.message}`);
				}
			} else {
				toast.error(
					'Failed to access microphone. Please check your system permissions.'
				);
			}

			setFallbackAvailable(true);
			cleanupRecording();
		}
	};

	const stopRecording = useCallback(() => {
		console.log('stopRecording called, isRecording state:', isRecording);

		// Use a ref to get the current recording state
		if (!streamRef.current && !mediaRecorderRef.current) {
			console.log('No active recording to stop');
			return;
		}

		console.log('Stopping recording, current elapsed time:', elapsedTime);

		// Clear timers first
		if (interval.current) {
			clearInterval(interval.current);
			interval.current = null;
		}

		// Set UI state immediately
		setIsRecording(false);

		// Stop the recorder immediately - no delays
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state === 'recording'
		) {
			console.log('Stopping MediaRecorder...');
			try {
				// Request final data before stopping
				mediaRecorderRef.current.requestData();
				// Stop immediately
				mediaRecorderRef.current.stop();
			} catch (error) {
				console.error('Error stopping MediaRecorder:', error);
			}
		}

		// Stop media stream tracks
		if (streamRef.current) {
			console.log('Stopping media stream tracks...');
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
	}, []); // Remove dependencies to prevent stale closures

	return (
		<>
			{!fallbackAvailable ? (
				<div className="flex items-center gap-4">
					{/* Audio player - only show if showPlayer is true and we have audio */}
					{showPlayer && audioUrl && (
						<div className="flex-1">
							<audio
								controls
								src={audioUrl}
								className="w-full"
								key={`audio-${Date.now()}`} // Use timestamp to force complete re-creation
								preload="auto"
								onLoadStart={() =>
									console.log('Audio loading started')
								}
								onCanPlay={() =>
									console.log('Audio can play now')
								}
							/>
						</div>
					)}

					{/* Recording button */}
					<div className="flex-shrink-0">
						<Button
							onClick={
								isRecording ? stopRecording : startRecording
							}
							variant={isRecording ? 'destructive' : 'default'}
							className={cn(
								'cursor-pointer flex items-center gap-2'
							)}
						>
							{isRecording ? (
								<>
									<div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
									<MicOff />
									{showLabels ? 'Stop Recording' : null}(
									{durationLimit - elapsedTime}s)
								</>
							) : (
								<>
									<Mic />
									{showLabels ? 'Start Recording' : null}(
									{durationLimit}s)
								</>
							)}
						</Button>
					</div>
				</div>
			) : (
				<div className="text-sm text-center">
					<p className="mb-2">Microphone not available.</p>
				</div>
			)}
		</>
	);
}
