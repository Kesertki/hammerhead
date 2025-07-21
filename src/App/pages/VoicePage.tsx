import { Check, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranscriptionResult } from '@/types';
import { AudioStorageService } from '@/utils/audioStorageService';
import { VoiceRecorder } from '../components/VoiceRecorder';

export function VoicePage() {
	const [transcription, setTranscription] =
		useState<TranscriptionResult | null>(null);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [transcriptionAvailable, setTranscriptionAvailable] = useState<
		boolean | null
	>(null);
	const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(
		null
	);
	const [copied, setCopied] = useState(false);

	// Check transcription availability on component mount
	useState(() => {
		AudioStorageService.checkTranscriptionAvailability().then(
			setTranscriptionAvailable
		);
	});

	const handleRecordingComplete = async (
		blob: Blob,
		duration: number
	): Promise<string | undefined> => {
		try {
			console.log('Recording completed:', {
				size: blob.size,
				type: blob.type,
				duration: duration
			});

			// Save the audio file using the audio storage service
			const audioMetadata = await AudioStorageService.saveAudio(
				blob,
				duration
			);

			if (audioMetadata) {
				console.log('Audio file saved:', audioMetadata);
				setCurrentAudioPath(audioMetadata.fullPath);

				toast.success(
					`Recording saved! Duration: ${duration}s, Size: ${Math.round(blob.size / 1024)}KB`
				);

				// Auto-transcribe if available
				if (transcriptionAvailable) {
					await handleTranscribe(audioMetadata.fullPath);
				}

				// Return the file path for future use
				return audioMetadata.fullPath;
			}

			toast.error('Failed to save recording');
			return undefined;
		} catch (error) {
			console.error('Failed to save audio recording:', error);
			toast.error('Failed to save recording');
			return undefined;
		}
	};

	const handleTranscribe = async (audioPath?: string) => {
		const pathToTranscribe = audioPath || currentAudioPath;

		if (!pathToTranscribe) {
			toast.error('No audio file to transcribe');
			return;
		}

		setIsTranscribing(true);
		setTranscription(null);

		try {
			console.log('Starting transcription...');
			const result =
				await AudioStorageService.transcribeAudio(pathToTranscribe);

			if (result) {
				setTranscription(result);
				toast.success('Transcription completed!');
			} else {
				toast.error('Transcription failed');
			}
		} catch (error) {
			console.error('Transcription error:', error);
			toast.error('Transcription failed');
		} finally {
			setIsTranscribing(false);
		}
	};

	const copyToClipboard = async () => {
		if (transcription?.text) {
			try {
				await navigator.clipboard.writeText(transcription.text);
				setCopied(true);
				toast.success('Text copied to clipboard');
				setTimeout(() => setCopied(false), 2000);
			} catch (error) {
				console.error('Failed to copy text:', error);
				toast.error('Failed to copy text');
			}
		}
	};

	return (
		<div className="p-4">
			<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
				Voice
			</h1>
			<p>Test your voice settings here.</p>

			<div className="mt-4 space-y-4">
				{/* Voice Recorder */}
				<Card className="w-full">
					<CardContent>
						<VoiceRecorder
							showPlayer={false}
							showLabels={false}
							onRecordingComplete={handleRecordingComplete}
						/>
					</CardContent>
				</Card>

				{/* Transcription Controls */}
				{currentAudioPath && transcriptionAvailable && (
					<Card className="w-full">
						<CardHeader>
							<CardTitle className="text-lg">
								Transcription
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button
								onClick={() => handleTranscribe()}
								disabled={isTranscribing}
								className="w-full"
							>
								{isTranscribing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Transcribing...
									</>
								) : (
									'Transcribe Audio'
								)}
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Transcription Results */}
				{transcription && (
					<Card className="w-full">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-lg">
								Transcription Result
							</CardTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={copyToClipboard}
								disabled={!transcription.text}
							>
								{copied ? (
									<>
										<Check className="mr-2 h-4 w-4" />
										Copied
									</>
								) : (
									<>
										<Copy className="mr-2 h-4 w-4" />
										Copy
									</>
								)}
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="p-3 bg-muted rounded-md">
									<p className="text-sm whitespace-pre-wrap">
										{transcription.text ||
											'No text detected'}
									</p>
								</div>

								{/* Transcription metadata */}
								<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
									{transcription.language && (
										<span>
											Language: {transcription.language}
										</span>
									)}
									{transcription.confidence && (
										<span>
											Confidence:{' '}
											{Math.round(
												transcription.confidence * 100
											)}
											%
										</span>
									)}
									{transcription.duration && (
										<span>
											Duration:{' '}
											{transcription.duration.toFixed(1)}s
										</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Transcription not available message */}
				{transcriptionAvailable === false && (
					<Card className="w-full max-w-xl mx-auto">
						<CardContent className="text-center py-6">
							<p className="text-muted-foreground">
								Speech-to-text transcription is not available.
							</p>
							<p className="text-xs text-muted-foreground mt-2">
								Install OpenAI Whisper to enable transcription:
								<br />
								<code className="bg-muted px-2 py-1 rounded text-xs">
									pip install openai-whisper
								</code>
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
