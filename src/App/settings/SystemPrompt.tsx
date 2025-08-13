import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SystemPromptConfig } from '@/types.ts';
import { eventBus } from '@/utils/eventBus.ts';
import { useTranslation } from 'react-i18next';

const SystemPrompt = () => {
    const { t } = useTranslation();
    const [systemPrompts, setSystemPrompts] = useState<SystemPromptConfig>();
    const [activePromptId, setActivePromptId] = useState('');
    const [promptText, setPromptText] = useState('');
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [nameDialogValue, setNameDialogValue] = useState('');
    const [nameDialogMode, setNameDialogMode] = useState<'rename' | 'create'>('rename');

    useEffect(() => {
        // Fetch system prompts from the store or API
        window.electronAPI.getSystemPrompts().then((config) => {
            setSystemPrompts(config);
            setActivePromptId(config.selectedPromptId);

            // Set the prompt text for the selected prompt
            const selectedPrompt = config.prompts.find((p) => p.id === config.selectedPromptId);
            if (selectedPrompt) {
                setPromptText(selectedPrompt.prompt);
            }

            // Send state update to layout
            updateLayoutState(config, config.selectedPromptId);
        });
    }, []);

    // Send state updates to the layout via event bus
    const updateLayoutState = useCallback((config: SystemPromptConfig, activeId: string) => {
        eventBus.emit('systemPrompt:stateUpdate', {
            activePromptId: activeId,
            prompts: config.prompts.map((p) => ({ id: p.id, name: p.name })),
            canDelete: config.prompts.length > 1,
        });
    }, []);

    // Update layout state when activePromptId or systemPrompts change
    useEffect(() => {
        if (systemPrompts) {
            updateLayoutState(systemPrompts, activePromptId);
        }
    }, [systemPrompts, activePromptId, updateLayoutState]);

    // Update prompt text when a different prompt is selected
    const handlePromptChange = useCallback(
        (promptId: string) => {
            setActivePromptId(promptId);
            const selectedPrompt = systemPrompts?.prompts.find((p) => p.id === promptId);
            if (selectedPrompt) {
                setPromptText(selectedPrompt.prompt);
            }
        },
        [systemPrompts]
    );

    const handleSave = useCallback(() => {
        if (!systemPrompts || !activePromptId) return;

        // Create updated prompts with the new text
        const updatedPrompts = {
            ...systemPrompts,
            selectedPromptId: activePromptId,
            prompts: systemPrompts.prompts.map((p) => (p.id === activePromptId ? { ...p, prompt: promptText } : p)),
        };

        // Save to electron API
        window.electronAPI
            .setSystemPrompts(updatedPrompts)
            .then(() => {
                setSystemPrompts(updatedPrompts);
                toast.success(t('prompts.msg.saved_successfully'));
            })
            .catch(() => {
                toast.error(t('prompts.msg.failed_to_save'));
            });
    }, [systemPrompts, activePromptId, promptText]);

    const handleDelete = useCallback(() => {
        if (!systemPrompts || !activePromptId) return;

        // Don't allow deleting if there's only one prompt
        if (systemPrompts.prompts.length <= 1) {
            console.error(t('prompts.msg.cannot_delete_only'));
            return;
        }

        // Filter out the active prompt
        const filteredPrompts = systemPrompts.prompts.filter((p) => p.id !== activePromptId);

        // Set the first prompt as selected after deletion
        const newSelectedId = filteredPrompts[0]?.id || '';

        const updatedPrompts = {
            selectedPromptId: newSelectedId,
            prompts: filteredPrompts,
        };

        // Save to electron API
        window.electronAPI
            .setSystemPrompts(updatedPrompts)
            .then(() => {
                setSystemPrompts(updatedPrompts);
                setActivePromptId(newSelectedId);
                setPromptText(filteredPrompts[0]?.prompt || '');
                toast.success(t('prompts.msg.deleted_successfully'));
            })
            .catch(() => {
                toast.error(t('prompts.msg.failed_to_delete'));
            });
    }, [systemPrompts, activePromptId]);

    const handleAddNewPrompt = useCallback(() => {
        if (!systemPrompts) return;

        // Set up dialog for creating new prompt
        setNameDialogMode('create');
        setNameDialogValue(`New Prompt ${systemPrompts.prompts.length + 1}`);
        setShowNameDialog(true);
    }, [systemPrompts]);

    const handleRenamePrompt = useCallback(() => {
        if (!systemPrompts || !activePromptId) return;

        // Find the current prompt
        const currentPrompt = systemPrompts.prompts.find((p) => p.id === activePromptId);
        if (!currentPrompt) return;

        // Set up dialog for renaming
        setNameDialogMode('rename');
        setNameDialogValue(currentPrompt.name);
        setShowNameDialog(true);
    }, [systemPrompts, activePromptId]);

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
                prompt: '',
            };

            const updatedPrompts = {
                ...systemPrompts,
                selectedPromptId: newId,
                prompts: [...systemPrompts.prompts, newPrompt],
            };

            window.electronAPI
                .setSystemPrompts(updatedPrompts)
                .then(() => {
                    setSystemPrompts(updatedPrompts);
                    setActivePromptId(newId);
                    setPromptText('');
                    setShowNameDialog(false);
                    setNameDialogValue('');
                    toast.success(t('prompts.msg.created_successfully'));
                })
                .catch(() => {
                    setShowNameDialog(false);
                    toast.error(t('prompts.msg.failed_to_create'));
                });
        } else if (nameDialogMode === 'rename' && activePromptId) {
            // Rename existing prompt
            const updatedPrompts = {
                ...systemPrompts,
                prompts: systemPrompts.prompts.map((p) =>
                    p.id === activePromptId ? { ...p, name: nameDialogValue.trim() } : p
                ),
            };

            window.electronAPI
                .setSystemPrompts(updatedPrompts)
                .then(() => {
                    setSystemPrompts(updatedPrompts);
                    setShowNameDialog(false);
                    setNameDialogValue('');
                    toast.success(t('prompts.msg.renamed_successfully'));
                })
                .catch(() => {
                    toast.error(t('prompts.msg.failed_to_rename'));
                    setShowNameDialog(false);
                });
        }
    };

    const handleCancelNameDialog = () => {
        setShowNameDialog(false);
        setNameDialogValue('');
    };

    // Listen for action events from the layout
    useEffect(() => {
        const unsubscribeAction = eventBus.on<string>('systemPrompt:action', (action) => {
            switch (action) {
                case 'save':
                    handleSave();
                    break;
                case 'delete':
                    handleDelete();
                    break;
                case 'add':
                    handleAddNewPrompt();
                    break;
                case 'rename':
                    handleRenamePrompt();
                    break;
            }
        });

        const unsubscribePromptChange = eventBus.on<string>('systemPrompt:promptChange', (promptId) => {
            handlePromptChange(promptId);
        });

        return () => {
            unsubscribeAction();
            unsubscribePromptChange();
        };
    }, [handleSave, handleDelete, handleAddNewPrompt, handleRenamePrompt, handlePromptChange]);

    return (
        <div className="flex flex-col h-full p-4">
            <Textarea
                className="flex-1 p-4 border rounded-md"
                placeholder={t('prompts.input_placeholder')}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
            />

            {/* Name Dialog (for both create and rename) */}
            <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {nameDialogMode === 'create'
                                ? t('prompts.dialog.create_new_prompt')
                                : t('prompts.dialog.rename_prompt')}
                        </DialogTitle>
                        <DialogDescription>
                            {nameDialogMode === 'create'
                                ? t('prompts.dialog.enter_name')
                                : t('prompts.dialog.enter_new_name')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                {t('prompts.dialog.name')}
                            </Label>
                            <Input
                                id="name"
                                value={nameDialogValue}
                                onChange={(e) => setNameDialogValue(e.target.value)}
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
                        <Button variant="outline" onClick={handleCancelNameDialog}>
                            {t('actions.cancel')}
                        </Button>
                        <Button onClick={handleConfirmNameDialog} disabled={!nameDialogValue.trim()}>
                            {nameDialogMode === 'create' ? t('actions.create') : t('actions.rename')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SystemPrompt;
