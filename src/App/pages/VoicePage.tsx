import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TranscriptionResult, VoiceSettings } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { VoiceInput } from '../components/VoiceInput';
import { VoiceSettings as VoiceSettingsComponent } from './VoiceSettings';

export function VoicePage() {
	const [transcription, setTranscription] =
		useState<TranscriptionResult | null>(null);
	const [copied, setCopied] = useState(false);
	const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
		model: 'tiny',
		language: ''
	});
	const [isLoadingSettings, setIsLoadingSettings] = useState(true);

	// Load voice settings on component mount
	useEffect(() => {
		loadVoiceSettings();
	}, []);

	const loadVoiceSettings = async () => {
		try {
			setIsLoadingSettings(true);
			const settings = await window.electronAPI.getVoiceSettings();
			if (settings) {
				setVoiceSettings(settings);
			}
		} catch (error) {
			console.error('Error loading voice settings:', error);
			// Use default settings if loading fails
		} finally {
			setIsLoadingSettings(false);
		}
	};

	const handleSettingsChange = async (newSettings: VoiceSettings) => {
		try {
			await window.electronAPI.setVoiceSettings(newSettings);
			setVoiceSettings(newSettings);
			toast.success('Voice settings saved successfully');
		} catch (error) {
			console.error('Error saving voice settings:', error);
			toast.error('Failed to save voice settings');
		}
	};

	const handleTranscriptionComplete = (result: TranscriptionResult) => {
		setTranscription(result);
	};

	const handleTranscriptionError = (error: Error) => {
		console.error('Transcription error:', error);
		// Error handling is already done in VoiceInput component
	};

	const copyToClipboardText = async () => {
		if (transcription?.text) {
			try {
				const success = await copyToClipboard(transcription.text);
				if (success) {
					setCopied(true);
					toast.success('Text copied to clipboard');
					setTimeout(() => setCopied(false), 2000);
				} else {
					toast.error('Failed to copy text');
				}
			} catch (error) {
				console.error('Failed to copy text:', error);
				toast.error('Failed to copy text');
			}
		}
	};

	return (
		<div className="h-full flex flex-col max-w-4xl mx-auto p-4">
			<Tabs defaultValue="parameters">
				<TabsList>
					<TabsTrigger value="parameters">Parameters</TabsTrigger>
					<TabsTrigger value="test">Test</TabsTrigger>
				</TabsList>
				<TabsContent value="parameters">
					<div className="flex-1 overflow-y-auto space-y-6">
						<VoiceSettingsComponent
							onSettingsChange={handleSettingsChange}
							settings={voiceSettings}
							isLoading={isLoadingSettings}
						/>
					</div>
				</TabsContent>
				<TabsContent value="test">
					<div>
						<p className="mb-4">Test your voice settings here.</p>
						<div className="space-y-4">
							{/* Voice Input */}
							{!isLoadingSettings ? (
								<VoiceInput
									onTranscriptionComplete={
										handleTranscriptionComplete
									}
									onTranscriptionError={
										handleTranscriptionError
									}
									model={voiceSettings.model}
									language={voiceSettings.language}
								/>
							) : (
								<div className="text-center text-muted-foreground">
									Loading voice settings...
								</div>
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
											onClick={copyToClipboardText}
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
														Language:{' '}
														{transcription.language}
													</span>
												)}
												{transcription.confidence && (
													<span>
														Confidence:{' '}
														{Math.round(
															transcription.confidence *
																100
														)}
														%
													</span>
												)}
												{transcription.duration && (
													<span>
														Duration:{' '}
														{transcription.duration.toFixed(
															1
														)}
														s
													</span>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
