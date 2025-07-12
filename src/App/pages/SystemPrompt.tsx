import { Edit3, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
	const [showNameDialog, setShowNameDialog] = useState(false);
	const [nameDialogValue, setNameDialogValue] = useState('');
	const [nameDialogMode, setNameDialogMode] = useState<'rename' | 'create'>(
		'rename'
	);

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

	const handleAddNewPrompt = () => {
		if (!systemPrompts) return;

		// Set up dialog for creating new prompt
		setNameDialogMode('create');
		setNameDialogValue(`New Prompt ${systemPrompts.prompts.length + 1}`);
		setShowNameDialog(true);
	};

	const handleRenamePrompt = () => {
		if (!systemPrompts || !activePromptId) return;

		// Find the current prompt
		const currentPrompt = systemPrompts.prompts.find(
			(p) => p.id === activePromptId
		);
		if (!currentPrompt) return;

		// Set up dialog for renaming
		setNameDialogMode('rename');
		setNameDialogValue(currentPrompt.name);
		setShowNameDialog(true);
	};

	const handleConfirmNameDialog = () => {
		if (!systemPrompts || !nameDialogValue.trim()) {
			setShowNameDialog(false);
			return;
		}

		if (nameDialogMode === 'create') {
			// Create new prompt
			const newId = `prompt_${Date.now()}`;
			const newPrompt = {
				id: newId,
				name: nameDialogValue.trim(),
				description: 'A new system prompt',
				prompt: ''
			};

			const updatedPrompts = {
				...systemPrompts,
				selectedPromptId: newId,
				prompts: [...systemPrompts.prompts, newPrompt]
			};

			window.electronAPI
				.setSystemPrompts(updatedPrompts)
				.then(() => {
					setSystemPrompts(updatedPrompts);
					setActivePromptId(newId);
					setPromptText('');
					setShowNameDialog(false);
					setNameDialogValue('');
					toast.success('New prompt created successfully');
				})
				.catch((err) => {
					setShowNameDialog(false);
					toast.error('Failed to create new prompt');
				});
		} else if (nameDialogMode === 'rename' && activePromptId) {
			// Rename existing prompt
			const updatedPrompts = {
				...systemPrompts,
				prompts: systemPrompts.prompts.map((p) =>
					p.id === activePromptId
						? { ...p, name: nameDialogValue.trim() }
						: p
				)
			};

			window.electronAPI
				.setSystemPrompts(updatedPrompts)
				.then(() => {
					setSystemPrompts(updatedPrompts);
					setShowNameDialog(false);
					setNameDialogValue('');
					toast.success('Prompt renamed successfully');
				})
				.catch((err) => {
					toast.error('Failed to rename prompt');
					setShowNameDialog(false);
				});
		}
	};

	const handleCancelNameDialog = () => {
		setShowNameDialog(false);
		setNameDialogValue('');
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
					<Button
						variant="outline"
						size="sm"
						onClick={handleRenamePrompt}
						disabled={!activePromptId}
						className="flex items-center gap-1"
					>
						<Edit3 className="w-4 h-4" />
						Rename
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

			{/* Name Dialog (for both create and rename) */}
			<Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							{nameDialogMode === 'create'
								? 'Create New Prompt'
								: 'Rename Prompt'}
						</DialogTitle>
						<DialogDescription>
							{nameDialogMode === 'create'
								? 'Enter a name for the new prompt.'
								: 'Enter a new name for this prompt.'}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								id="name"
								value={nameDialogValue}
								onChange={(e) =>
									setNameDialogValue(e.target.value)
								}
								className="col-span-3"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleConfirmNameDialog();
									} else if (e.key === 'Escape') {
										handleCancelNameDialog();
									}
								}}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancelNameDialog}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmNameDialog}
							disabled={!nameDialogValue.trim()}
						>
							{nameDialogMode === 'create' ? 'Create' : 'Rename'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default SystemPrompt;
