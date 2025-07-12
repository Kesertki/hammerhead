import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
				(p: any) => p.id === config.selectedPromptId
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

	const handleAddNewPrompt = () => {
		if (!systemPrompts) return;

		// Generate a new unique ID
		const newId = `prompt_${Date.now()}`;
		const newPromptName = `New Prompt ${systemPrompts.prompts.length + 1}`;

		// Create new prompt object
		const newPrompt = {
			id: newId,
			name: newPromptName,
			description: 'A new system prompt',
			prompt: ''
		};

		// Add the new prompt to the collection
		const updatedPrompts = {
			...systemPrompts,
			selectedPromptId: newId,
			prompts: [...systemPrompts.prompts, newPrompt]
		};

		// Save to electron API
		window.electronAPI
			.setSystemPrompts(updatedPrompts)
			.then(() => {
				setSystemPrompts(updatedPrompts);
				setActivePromptId(newId);
				setPromptText('');
				toast.success('New prompt created successfully');
			})
			.catch((err) => {
				toast.error('Failed to create new prompt');
			});
	};

	return (
		<div className="flex flex-col h-full p-4">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Select
						value={activePromptId}
						onValueChange={handlePromptChange}
					>
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
					<Button
						variant="outline"
						size="sm"
						onClick={handleAddNewPrompt}
						className="flex items-center gap-1"
					>
						<Plus className="w-4 h-4" />
						Add New
					</Button>
				</div>
				<div className="space-x-2">
					<Button onClick={handleSave}>Save</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={
							!systemPrompts || systemPrompts.prompts.length <= 1
						}
					>
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
