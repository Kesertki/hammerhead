import { CircleStop, Mic } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    durationLimit?: number; // in seconds, 0 means no limit
    onRecordingComplete?: (blob: Blob, duration: number) => void | Promise<void | string>; // Callback when recording is complete
    onRecordingStateChange?: (isRecording: boolean) => void; // New prop to report recording state
    disabled?: boolean; // New prop to disable the component
};

export function VoiceRecorder({
    durationLimit = 0,
    onRecordingComplete,
    onRecordingStateChange,
    disabled = false,
}: Props) {
    const [isRecording, setIsRecording] = useState(false);
    const [fallbackAvailable, setFallbackAvailable] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const chunks = useRef<Blob[]>([]);
    const interval = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const elapsedTimeRef = useRef<number>(0);

    useEffect(() => {
        setFallbackAvailable(
            typeof navigator === 'undefined' || !navigator.mediaDevices || typeof MediaRecorder === 'undefined'
        );
    }, []);

    // Report recording state changes
    useEffect(() => {
        onRecordingStateChange?.(isRecording);
    }, [isRecording, onRecordingStateChange]);

    // Cleanup function to properly stop all recording resources
    const cleanupRecording = useCallback(() => {
        // Clear timers first
        if (interval.current) {
            clearInterval(interval.current);
            interval.current = null;
        }

        // Stop media recorder if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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
        };
    }, [cleanupRecording]);

    const getMimeType = () => {
        // Test MIME types in order of preference
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Using MIME type:', type);
                return type;
            }
        }

        console.log('No supported MIME type found, using default (empty string)');
        return '';
    };

    // Check microphone permissions
    const checkMicrophonePermission = async () => {
        try {
            // Check if navigator.permissions is available
            if (navigator.permissions && navigator.permissions.query) {
                const permissionStatus = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                console.log('Microphone permission status:', permissionStatus.state);
                return permissionStatus.state === 'granted';
            }

            // Fallback: try to access microphone directly
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            stream.getTracks().forEach((track) => track.stop()); // Clean up test stream
            return true;
        } catch (error) {
            console.log('Microphone permission check failed:', error);
            return false;
        }
    };

    const startRecording = async () => {
        // Don't start recording if disabled
        if (disabled) return;

        try {
            // Check microphone permissions first
            const hasPermission = await checkMicrophonePermission();
            if (!hasPermission) {
                toast.error('Microphone permission is required. Please allow microphone access and try again.');
                return;
            }

            // Clean up any existing recording first
            cleanupRecording();

            // Reset for new recording
            setElapsedTime(0);
            elapsedTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100, // CD-quality audio
                    channelCount: 1, // Mono recording for better compatibility
                    echoCancellation: true, // Enable echo cancellation
                    noiseSuppression: true, // Enable noise suppression
                    autoGainControl: true, // Enable automatic gain control
                },
            });
            streamRef.current = stream;

            console.log('Audio stream obtained:', stream.getAudioTracks()[0]?.getSettings());

            const mimeType = getMimeType();
            console.log('Using MIME type for recording:', mimeType);

            const recorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 }
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
                console.log('Recorder stopped, elapsed time:', currentElapsed, 'chunks:', chunks.current.length);

                if (chunks.current.length > 0) {
                    const audioBlob = new Blob(chunks.current, {
                        type: mimeType || 'audio/webm',
                    });

                    console.log('Blob created:', {
                        size: audioBlob.size,
                        type: audioBlob.type,
                        chunks: chunks.current.length,
                        recordingDuration: currentElapsed,
                    });

                    // Call the callback with the blob and duration (handle async callbacks)
                    try {
                        const result = onRecordingComplete?.(audioBlob, currentElapsed);
                        if (result && typeof result.then === 'function') {
                            result.catch((error) => {
                                console.error('Error in recording callback:', error);
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
                    // Auto-stop when duration limit is reached (only if limit is set)
                    if (durationLimit > 0 && nextValue >= durationLimit) {
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
                        toast.error('No microphone found. Please connect a microphone and try again.');
                        break;
                    case 'NotReadableError':
                        toast.error('Microphone is already in use by another application.');
                        break;
                    default:
                        toast.error(`Microphone error: ${err.message}`);
                }
            } else {
                toast.error('Failed to access microphone. Please check your system permissions.');
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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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
    }, []);

    return (
        <>
            {!fallbackAvailable ? (
                <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? 'destructive' : 'default'}
                    className={cn('cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}
                    size="icon"
                    disabled={disabled}
                >
                    {isRecording ? (
                        <>
                            <CircleStop className="h-4 w-4 animate-pulse" />
                            {durationLimit > 0 && ` (${durationLimit - elapsedTime}s)`}
                        </>
                    ) : (
                        <>
                            <Mic />
                            {durationLimit > 0 && ` (${durationLimit}s)`}
                        </>
                    )}
                </Button>
            ) : (
                <div className="text-sm text-center">
                    <p className="mb-2">Microphone not available.</p>
                </div>
            )}
        </>
    );
}
