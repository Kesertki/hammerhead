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
import { DEFAULT_APPEARANCE_SETTINGS, AppearanceSettings } from '@/types';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

const themes = [
    { value: 'system', labelKey: 'theme_system' },
    { value: 'dark', labelKey: 'theme_dark' },
    { value: 'light', labelKey: 'theme_light' },
] as const;

const FormSchema = z.object({
    theme: z.enum(['system', 'dark', 'light']),
});

type FormData = z.infer<typeof FormSchema>;

const AppearanceSettingsPage = () => {
    const { t } = useTranslation();
    const { setTheme } = useTheme();
    const [themeOpen, setThemeOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);

    // Debouncing for text inputs
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 500;

    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: { theme: DEFAULT_APPEARANCE_SETTINGS.theme },
    });

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const loadedSettings = await window.electronAPI.getAppearanceSettings();
            if (loadedSettings) {
                setSettings(loadedSettings);
                // Apply the theme when settings are loaded
                setTheme(loadedSettings.theme);
            }
        } catch (error) {
            console.error('Error loading appearance settings:', error);
            // Use default settings if loading fails
        } finally {
            setIsLoading(false);
        }
    };

    // Update form when settings state changes
    useEffect(() => {
        if (settings) {
            form.reset({
                theme: settings.theme,
            });
        }
    }, [settings, form]);

    // Debounced save function for text inputs
    const debouncedSave = useCallback((newSettings: AppearanceSettings) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            saveSettings(newSettings);
        }, DEBOUNCE_DELAY);
    }, []);

    // Immediate save function for switches and dropdowns
    const immediateSave = useCallback((newSettings: AppearanceSettings) => {
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
                if (currentFormData.theme !== undefined) {
                    const newSettings: AppearanceSettings = {
                        theme: currentFormData.theme,
                    };

                    // Use immediate save for theme changes
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
                if (currentFormData.theme !== undefined) {
                    const newSettings: AppearanceSettings = {
                        theme: currentFormData.theme,
                    };
                    saveSettings(newSettings);
                }
            }
        };
    }, [form]);

    const saveSettings = async (newSettings: AppearanceSettings) => {
        try {
            await window.electronAPI.setAppearanceSettings(newSettings);
            setSettings(newSettings);

            // Update theme when theme setting changes
            if (newSettings.theme) {
                setTheme(newSettings.theme);
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
                                name="theme"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('theme')}</FormLabel>
                                        <Popover open={themeOpen} onOpenChange={setThemeOpen}>
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
                                                            ? t(
                                                                  themes.find((theme) => theme.value === field.value)
                                                                      ?.labelKey || 'theme_system'
                                                              )
                                                            : t('select_theme')}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('search_theme')} className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>{t('no_theme_found')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {themes.map((theme) => (
                                                                <CommandItem
                                                                    value={t(theme.labelKey)}
                                                                    key={theme.value}
                                                                    onSelect={() => {
                                                                        form.setValue('theme', theme.value, {
                                                                            shouldValidate: true,
                                                                        });
                                                                        setThemeOpen(false);
                                                                    }}
                                                                >
                                                                    {t(theme.labelKey)}
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto',
                                                                            theme.value === field.value
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
                                        <FormDescription>{t('theme_description')}</FormDescription>
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

export default AppearanceSettingsPage;
