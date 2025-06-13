import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SystemPromptConfig } from '@/types.ts';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const SystemPrompt = () => {
	const [systemPrompts, setSystemPrompts] = useState<SystemPromptConfig>();
	const [activePromptId, setActivePromptId] = useState('');
	const [promptText, setPromptText] = useState('');

	useEffect(() => {
		// Fetch system prompts from the store or API
		window.electronAPI.getSystemPrompts().then((config) => {
			setSystemPrompts(config);
			setActivePromptId(config.selectedPromptId);

			// Set the prompt text for the selected prompt
			const selectedPrompt = config.prompts.find(
				(p) => p.id === config.selectedPromptId
			);
			if (selectedPrompt) {
				setPromptText(selectedPrompt.prompt);
			}
		});
	}, []);

	// Update prompt text when a different prompt is selected
	const handlePromptChange = (promptId: string) => {
		setActivePromptId(promptId);
		const selectedPrompt = systemPrompts?.prompts.find(
			(p) => p.id === promptId
		);
		if (selectedPrompt) {
			setPromptText(selectedPrompt.prompt);
		}
	};

	const handleSave = () => {
		if (!systemPrompts || !activePromptId) return;

		// Create updated prompts with the new text
		const updatedPrompts = {
			...systemPrompts,
			selectedPromptId: activePromptId,
			prompts: systemPrompts.prompts.map((p) =>
				p.id === activePromptId ? { ...p, prompt: promptText } : p
			)
		};

		// Save to electron API
		window.electronAPI
			.setSystemPrompts(updatedPrompts)
			.then(() => {
				setSystemPrompts(updatedPrompts);
				toast.success('Prompt saved successfully');
			})
			.catch((err) => {
				toast.error('Failed to save prompt');
			});
	};

	const handleDelete = () => {
		if (!systemPrompts || !activePromptId) return;

		// Don't allow deleting if there's only one prompt
		if (systemPrompts.prompts.length <= 1) {
			console.error('Cannot delete the only prompt');
			return;
		}

		// Filter out the active prompt
		const filteredPrompts = systemPrompts.prompts.filter(
			(p) => p.id !== activePromptId
		);

		// Set the first prompt as selected after deletion
		const newSelectedId = filteredPrompts[0]?.id || '';

		const updatedPrompts = {
			selectedPromptId: newSelectedId,
			prompts: filteredPrompts
		};

		// Save to electron API
		window.electronAPI
			.setSystemPrompts(updatedPrompts)
			.then(() => {
				setSystemPrompts(updatedPrompts);
				setActivePromptId(newSelectedId);
				setPromptText(filteredPrompts[0]?.prompt || '');
				toast.success('Prompt deleted successfully');
			})
			.catch((err) => {
				toast.error('Failed to delete prompt');
			});
	};

	return (
		<div className="flex flex-col h-full p-4">
			<div className="flex items-center justify-between mb-4">
				<Select value={activePromptId} onValueChange={handlePromptChange}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Select a prompt" />
					</SelectTrigger>
					<SelectContent>
						{systemPrompts?.prompts.map((prompt) => (
							<SelectItem key={prompt.id} value={prompt.id}>
								{prompt.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="space-x-2">
					<Button onClick={handleSave}>Save</Button>
					<Button variant="destructive" onClick={handleDelete}>
						Delete
					</Button>
				</div>
			</div>
			<Textarea
				className="flex-1 p-4 border rounded-md"
				placeholder="Enter your prompt here..."
				value={promptText}
				onChange={(e) => setPromptText(e.target.value)}
			/>
		</div>
	);
};

export default SystemPrompt;
