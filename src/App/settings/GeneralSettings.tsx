// import { useExternalState } from '@/hooks/useExternalState';
// import { llmState } from '@/state/llmState';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { DEFAULT_GENERAL_SETTINGS, GeneralSettings } from '@/types';
import { useTranslation } from 'react-i18next';

const languages = [
    { value: 'en', label: 'English' },
    { value: 'uk', label: 'Ukrainian' },
];

const FormSchema = z.object({
    language: z.string().min(1, 'Please select a language.'),
});

export const GeneralSettingsPage = () => {
    // const state = useExternalState(llmState);
    const { t, i18n } = useTranslation();
    const [langOpen, setLangOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);

    // Debouncing for text inputs
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 500;

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { language: DEFAULT_GENERAL_SETTINGS.language },
    });

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const loadedSettings = await window.electronAPI.getGeneralSettings();
            if (loadedSettings) {
                setSettings(loadedSettings);
            }
        } catch (error) {
            console.error('Error loading general settings:', error);
            // Use default settings if loading fails
        } finally {
            setIsLoading(false);
        }
    };

    // Update form when settings state changes
    useEffect(() => {
        if (settings) {
            form.reset({
                language: settings.language,
            });
        }
    }, [settings, form]);

    // Debounced save function for text inputs
    const debouncedSave = useCallback((newSettings: GeneralSettings) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            saveSettings(newSettings);
        }, DEBOUNCE_DELAY);
    }, []);

    // Immediate save function for switches and dropdowns
    const immediateSave = useCallback((newSettings: GeneralSettings) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        saveSettings(newSettings);
    }, []);

    // Watch for changes in form fields with different save strategies
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name && value[name as keyof typeof value] !== undefined) {
                const currentFormData = form.getValues();
                // Only auto-save if all required fields have values
                if (currentFormData.language !== undefined) {
                    const newSettings: GeneralSettings = {
                        language: currentFormData.language,
                    };

                    // Use immediate save for language changes
                    immediateSave(newSettings);
                }
            }
        });
        return () => {
            subscription.unsubscribe();
            // Clean up debounce timeout on unmount
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [form, debouncedSave, immediateSave]);

    // Cleanup effect to ensure pending saves are executed on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                // Execute any pending save immediately on unmount
                const currentFormData = form.getValues();
                if (currentFormData.language !== undefined) {
                    const newSettings: GeneralSettings = {
                        language: currentFormData.language,
                    };
                    saveSettings(newSettings);
                }
            }
        };
    }, [form]);

    const saveSettings = async (newSettings: GeneralSettings) => {
        try {
            await window.electronAPI.setGeneralSettings(newSettings);
            setSettings(newSettings);

            // Update i18n language when language setting changes
            if (newSettings.language && i18n.language !== newSettings.language) {
                await i18n.changeLanguage(newSettings.language);
            }

            // toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            // toast.error('Failed to save settings');
        }
    };

    return (
        <div className="h-full flex flex-col mx-auto p-4">
            <Form {...form}>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-4">{t('loading_settings')}</div>
                    ) : (
                        <>
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('language')}</FormLabel>
                                        <Popover open={langOpen} onOpenChange={setLangOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            'w-[200px] justify-between',
                                                            field.value === undefined && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {field.value !== undefined
                                                            ? languages.find(
                                                                  (language) => language.value === field.value
                                                              )?.label
                                                            : t('select_language')}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('search_language')} className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>{t('no_language_found')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {languages.map((language) => (
                                                                <CommandItem
                                                                    value={language.label}
                                                                    key={language.value}
                                                                    onSelect={() => {
                                                                        form.setValue('language', language.value, {
                                                                            shouldValidate: true,
                                                                        });
                                                                        setLangOpen(false);
                                                                    }}
                                                                >
                                                                    {language.label}
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto',
                                                                            language.value === field.value
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0'
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>{t('language_description')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>
            </Form>
        </div>
    );
};
