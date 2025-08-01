import { Loader2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { TranscriptionResult } from '@/types';
import { AudioStorageService } from '@/utils/audioStorageService';
import { VoiceRecorder } from './VoiceRecorder';

type VoiceInputProps = {
    onTranscriptionComplete?: (result: TranscriptionResult) => void;
    onTranscriptionError?: (error: Error) => void;
    onStateChange?: (isActive: boolean) => void; // New prop to report active state
    showPlayer?: boolean;
    showLabels?: boolean;
    disabled?: boolean; // New prop to disable the component
    durationLimit?: number; // Recording duration limit in seconds (0 = no limit)
    showNotifications?: boolean; // Whether to show toast notifications
    model?: string; // Optional model to use for transcription
    language?: string; // Optional language for transcription
    dockerImage?: string; // Optional Docker image name for transcription
};

export function VoiceInput({
    onTranscriptionComplete,
    onTranscriptionError,
    onStateChange,
    disabled = false,
    durationLimit = 0,
    showNotifications = true,
    model = 'tiny',
    language = 'en',
    dockerImage = 'whisper',
}: VoiceInputProps) {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptionAvailable, setTranscriptionAvailable] = useState<boolean | null>(null);
    const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // Report active state (recording or transcribing) to parent
    const isActive = isRecording || isTranscribing;
    useEffect(() => {
        onStateChange?.(isActive);
    }, [isActive, onStateChange]);

    const handleRecordingStateChange = useCallback((recording: boolean) => {
        setIsRecording(recording);
    }, []);

    // Check transcription availability on component mount
    useEffect(() => {
        AudioStorageService.checkTranscriptionAvailability(dockerImage).then(setTranscriptionAvailable);
    }, [dockerImage]);

    const handleRecordingComplete = async (blob: Blob, duration: number): Promise<string | undefined> => {
        try {
            console.log('Recording completed:', {
                size: blob.size,
                type: blob.type,
                duration: duration,
            });

            // Save the audio file using the audio storage service
            const audioMetadata = await AudioStorageService.saveAudio(blob, duration);

            if (audioMetadata) {
                console.log('Audio file saved:', audioMetadata);
                setCurrentAudioPath(audioMetadata.fullPath);

                if (showNotifications) {
                    toast.success(`Recording saved! Duration: ${duration}s, Size: ${Math.round(blob.size / 1024)}KB`);
                }

                // Auto-transcribe if available
                if (transcriptionAvailable) {
                    await handleTranscribe(audioMetadata.fullPath);
                }

                // Return the file path for future use
                return audioMetadata.fullPath;
            }

            if (showNotifications) {
                toast.error('Failed to save recording');
            }
            return undefined;
        } catch (error) {
            console.error('Failed to save audio recording:', error);
            if (showNotifications) {
                toast.error('Failed to save recording');
            }
            return undefined;
        }
    };

    const handleTranscribe = async (audioPath?: string) => {
        // Don't start transcription if disabled
        if (disabled) return;

        const pathToTranscribe = audioPath || currentAudioPath;

        if (!pathToTranscribe) {
            if (showNotifications) {
                toast.error('No audio file to transcribe');
            }
            return;
        }

        setIsTranscribing(true);

        // Create abort controller for cancellation
        const controller = new AbortController();
        setAbortController(controller);

        try {
            console.log('Starting transcription...');
            const result = await AudioStorageService.transcribeAudio(pathToTranscribe, model, language, dockerImage);

            if (result) {
                if (showNotifications) {
                    toast.success('Transcription completed!');
                }
                onTranscriptionComplete?.(result);
            } else {
                const error = new Error('Transcription failed');
                if (showNotifications) {
                    toast.error('Transcription failed');
                }
                onTranscriptionError?.(error);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Transcription cancelled');
                if (showNotifications) {
                    toast.info('Transcription cancelled');
                }
            } else {
                console.error('Transcription error:', error);
                if (showNotifications) {
                    toast.error('Transcription failed');
                }
                onTranscriptionError?.(error as Error);
            }
        } finally {
            setIsTranscribing(false);
            setAbortController(null);
        }
    };

    const cancelTranscription = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setIsTranscribing(false);
            if (showNotifications) {
                toast.info('Cancelling transcription...');
            }
        }
    };

    // Show transcription unavailable message if needed
    if (transcriptionAvailable === false) {
        return (
            <div className="text-center py-6">
                <p className="text-muted-foreground">Speech-to-text transcription is not available.</p>
                <p className="text-xs text-muted-foreground mt-2">
                    Build the Whisper Docker image to enable transcription:
                    <br />
                    <code className="bg-muted px-2 py-1 rounded text-xs">cd docker/whisper</code>
                    <br />
                    <code className="bg-muted px-2 py-1 rounded text-xs">docker build -t whisper .</code>
                </p>
            </div>
        );
    }

    return (
        <>
            {isTranscribing ? (
                // Show transcription button when transcribing
                <Button onClick={cancelTranscription} variant="destructive" disabled={disabled} size="icon">
                    {/* <Loader2 className="h-4 w-4 animate-spin" /> */}
                    <Loader2Icon className="animate-spin" />
                </Button>
            ) : (
                // Show voice recorder when not transcribing
                <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    onRecordingStateChange={handleRecordingStateChange}
                    disabled={disabled}
                    durationLimit={durationLimit}
                />
            )}
        </>
    );
}
