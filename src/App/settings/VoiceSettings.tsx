import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Copy, Trash2 } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { TranscriptionResult, VoiceSettings } from '@/types';
import { DEFAULT_VOICE_SETTINGS } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { VoiceInput } from '../components/VoiceInput';

const models = [
    { label: 'Tiny (recommended)', value: 'tiny' },
    // { label: 'Base', value: 'base' },
    // { label: 'Small', value: 'small' },
    // { label: 'Medium', value: 'medium' },
    // { label: 'Large', value: 'large' },
    // { label: 'Turbo', value: 'turbo' },
];

const languages = [
    { label: 'autodetect', value: '' },
    { label: 'Afrikaans', value: 'af' },
    { label: 'Albanian', value: 'sq' },
    { label: 'Amharic', value: 'am' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Armenian', value: 'hy' },
    { label: 'Assamese', value: 'as' },
    { label: 'Azerbaijani', value: 'az' },
    { label: 'Bashkir', value: 'ba' },
    { label: 'Basque', value: 'eu' },
    { label: 'Belarusian', value: 'be' },
    { label: 'Bengali', value: 'bn' },
    { label: 'Bosnian', value: 'bs' },
    { label: 'Breton', value: 'br' },
    { label: 'Bulgarian', value: 'bg' },
    { label: 'Burmese', value: 'my' },
    { label: 'Cantonese', value: 'yue' },
    { label: 'Catalan', value: 'ca' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Croatian', value: 'hr' },
    { label: 'Czech', value: 'cs' },
    { label: 'Danish', value: 'da' },
    { label: 'Dutch', value: 'nl' },
    { label: 'English', value: 'en' },
    { label: 'Estonian', value: 'et' },
    { label: 'Faroese', value: 'fo' },
    { label: 'Finnish', value: 'fi' },
    { label: 'French', value: 'fr' },
    { label: 'Galician', value: 'gl' },
    { label: 'Georgian', value: 'ka' },
    { label: 'German', value: 'de' },
    { label: 'Greek', value: 'el' },
    { label: 'Gujarati', value: 'gu' },
    { label: 'Haitian Creole', value: 'ht' },
    { label: 'Hausa', value: 'ha' },
    { label: 'Hawaiian', value: 'haw' },
    { label: 'Hebrew', value: 'he' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Hungarian', value: 'hu' },
    { label: 'Icelandic', value: 'is' },
    { label: 'Indonesian', value: 'id' },
    { label: 'Italian', value: 'it' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Javanese', value: 'jw' },
    { label: 'Kannada', value: 'kn' },
    { label: 'Kazakh', value: 'kk' },
    { label: 'Khmer', value: 'km' },
    { label: 'Korean', value: 'ko' },
    { label: 'Lao', value: 'lo' },
    { label: 'Latin', value: 'la' },
    { label: 'Latvian', value: 'lv' },
    { label: 'Lingala', value: 'ln' },
    { label: 'Lithuanian', value: 'lt' },
    { label: 'Luxembourgish', value: 'lb' },
    { label: 'Macedonian', value: 'mk' },
    { label: 'Malagasy', value: 'mg' },
    { label: 'Malay', value: 'ms' },
    { label: 'Malayalam', value: 'ml' },
    { label: 'Maltese', value: 'mt' },
    { label: 'Maori', value: 'mi' },
    { label: 'Marathi', value: 'mr' },
    { label: 'Mongolian', value: 'mn' },
    { label: 'Nepali', value: 'ne' },
    { label: 'Norwegian', value: 'no' },
    { label: 'Norwegian Nynorsk', value: 'nn' },
    { label: 'Occitan', value: 'oc' },
    { label: 'Pashto', value: 'ps' },
    { label: 'Persian', value: 'fa' },
    { label: 'Polish', value: 'pl' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Punjabi', value: 'pa' },
    { label: 'Romanian', value: 'ro' },
    { label: 'Russian', value: 'ru' },
    { label: 'Sanskrit', value: 'sa' },
    { label: 'Serbian', value: 'sr' },
    { label: 'Shona', value: 'sn' },
    { label: 'Sindhi', value: 'sd' },
    { label: 'Sinhala', value: 'si' },
    { label: 'Slovak', value: 'sk' },
    { label: 'Slovenian', value: 'sl' },
    { label: 'Somali', value: 'so' },
    { label: 'Spanish', value: 'es' },
    { label: 'Sundanese', value: 'su' },
    { label: 'Swahili', value: 'sw' },
    { label: 'Swedish', value: 'sv' },
    { label: 'Tagalog', value: 'tl' },
    { label: 'Tajik', value: 'tg' },
    { label: 'Tamil', value: 'ta' },
    { label: 'Tatar', value: 'tt' },
    { label: 'Telugu', value: 'te' },
    { label: 'Thai', value: 'th' },
    { label: 'Tibetan', value: 'bo' },
    { label: 'Turkish', value: 'tr' },
    { label: 'Turkmen', value: 'tk' },
    { label: 'Ukrainian', value: 'uk' },
    { label: 'Urdu', value: 'ur' },
    { label: 'Uzbek', value: 'uz' },
    { label: 'Vietnamese', value: 'vi' },
    { label: 'Welsh', value: 'cy' },
    { label: 'Yiddish', value: 'yi' },
    { label: 'Yoruba', value: 'yo' },
] as const;

// Debounce delay for text input auto-save (in milliseconds)
const DEBOUNCE_DELAY = 500;

const FormSchema = z.object({
    enabled: z.boolean(),
    dockerImage: z
        .string({
            required_error: 'Please enter a Docker image name.',
        })
        .min(1, 'Docker image name is required.'),
    model: z.string({
        required_error: 'Please select a transcription model.',
    }),
    language: z.string({
        required_error: 'Please select a language.',
    }),
});

export function VoiceSettings() {
    const { t } = useTranslation();
    const [langOpen, setLangOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

    // Debouncing for text inputs
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Test functionality state
    const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: DEFAULT_VOICE_SETTINGS,
    });

    // Watch the enabled field to control other field states
    const isEnabled = form.watch('enabled');

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const loadedSettings = await window.electronAPI.getVoiceSettings();
            if (loadedSettings) {
                setSettings(loadedSettings);
            }
        } catch (error) {
            console.error('Error loading voice settings:', error);
            // Use default settings if loading fails
        } finally {
            setIsLoading(false);
        }
    };

    // Update form when settings state changes
    useEffect(() => {
        if (settings) {
            form.reset({
                enabled: settings.enabled,
                dockerImage: settings.dockerImage,
                model: settings.model,
                language: settings.language,
            });
        }
    }, [settings, form]);

    // Debounced save function for text inputs
    const debouncedSave = useCallback((newSettings: VoiceSettings) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            saveSettings(newSettings);
        }, DEBOUNCE_DELAY);
    }, []);

    // Immediate save function for switches and dropdowns
    const immediateSave = useCallback((newSettings: VoiceSettings) => {
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
                if (
                    currentFormData.dockerImage &&
                    currentFormData.model &&
                    currentFormData.language !== undefined &&
                    currentFormData.enabled !== undefined
                ) {
                    const newSettings: VoiceSettings = {
                        enabled: currentFormData.enabled,
                        dockerImage: currentFormData.dockerImage,
                        model: currentFormData.model,
                        language: currentFormData.language,
                    };

                    // Use immediate save for switches/dropdowns, debounced for text inputs
                    if (name === 'dockerImage') {
                        debouncedSave(newSettings);
                    } else {
                        // enabled, model, language changes should be immediate
                        immediateSave(newSettings);
                    }
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
                if (
                    currentFormData.dockerImage &&
                    currentFormData.model &&
                    currentFormData.language !== undefined &&
                    currentFormData.enabled !== undefined
                ) {
                    const newSettings: VoiceSettings = {
                        enabled: currentFormData.enabled,
                        dockerImage: currentFormData.dockerImage,
                        model: currentFormData.model,
                        language: currentFormData.language,
                    };
                    saveSettings(newSettings);
                }
            }
        };
    }, [form]);

    const saveSettings = async (newSettings: VoiceSettings) => {
        try {
            await window.electronAPI.setVoiceSettings(newSettings);
            setSettings(newSettings);
            // toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
    };

    // Test functionality handlers
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

    const clearTranscription = () => {
        setTranscription(null);
        setCopied(false);
    };

    return (
        <div className="h-full flex flex-col mx-auto p-4">
            <Form {...form}>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-4">{t('loading')}</div>
                    ) : (
                        <>
                            <FormField
                                control={form.control}
                                name="enabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <FormDescription>{t('voice.toggle')}</FormDescription>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dockerImage"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.docker_image_name')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!isEnabled}
                                                placeholder="whisper"
                                                className={cn(
                                                    'w-[200px]',
                                                    !isEnabled && 'opacity-50 cursor-not-allowed'
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.docker_image_description')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.model')}
                                        </FormLabel>
                                        <Popover
                                            open={isEnabled && modelOpen}
                                            onOpenChange={(open) => isEnabled && setModelOpen(open)}
                                        >
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        disabled={!isEnabled}
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            'w-[200px] justify-between',
                                                            field.value === undefined && 'text-muted-foreground',
                                                            !isEnabled && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    >
                                                        {field.value !== undefined
                                                            ? models.find((model) => model.value === field.value)?.label
                                                            : t('model.select_model')}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder={t('voice.search_model')}
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>{t('model.no_model_found')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {models.map((model) => (
                                                                <CommandItem
                                                                    value={model.label}
                                                                    key={model.value}
                                                                    onSelect={() => {
                                                                        if (isEnabled) {
                                                                            form.setValue('model', model.value, {
                                                                                shouldValidate: true,
                                                                            });
                                                                            setModelOpen(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    {model.label}
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto',
                                                                            model.value === field.value
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
                                        <FormDescription className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.model_description')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.language')}
                                        </FormLabel>
                                        <Popover
                                            open={isEnabled && langOpen}
                                            onOpenChange={(open) => isEnabled && setLangOpen(open)}
                                        >
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        disabled={!isEnabled}
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            'w-[200px] justify-between',
                                                            field.value === undefined && 'text-muted-foreground',
                                                            !isEnabled && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    >
                                                        {field.value !== undefined
                                                            ? languages.find(
                                                                  (language) => language.value === field.value
                                                              )?.label
                                                            : t('voice.select_language')}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder={t('voice.search_language')}
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>{t('voice.no_language_found')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {languages.map((language) => (
                                                                <CommandItem
                                                                    value={language.label}
                                                                    key={language.value}
                                                                    onSelect={() => {
                                                                        if (isEnabled) {
                                                                            form.setValue('language', language.value, {
                                                                                shouldValidate: true,
                                                                            });
                                                                            setLangOpen(false);
                                                                        }
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
                                        <FormDescription className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            {t('voice.language_description')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Test Section */}
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">{t('voice.test_voice_settings')}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('voice.test_voice_settings_description')}
                                    </p>
                                </div>

                                {/* Voice Input Test */}
                                {isEnabled && settings ? (
                                    <div className="flex items-center gap-2">
                                        <VoiceInput
                                            onTranscriptionComplete={handleTranscriptionComplete}
                                            onTranscriptionError={handleTranscriptionError}
                                            dockerImage={settings.dockerImage}
                                            model={settings.model}
                                            language={settings.language}
                                        />
                                        {transcription && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={clearTranscription}
                                                title="Clear transcription"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        {t('voice.test_voice_input_disabled')}
                                    </div>
                                )}

                                {/* Transcription Results */}
                                {isEnabled && transcription && (
                                    <Card className="w-full">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-lg">{t('voice.transcription_result')}</CardTitle>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={copyToClipboardText}
                                                disabled={!transcription.text}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        {t('actions.copied')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        {t('actions.copy')}
                                                    </>
                                                )}
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="p-3 bg-muted rounded-md">
                                                    <p className="text-sm whitespace-pre-wrap">
                                                        {transcription.text || 'No text detected'}
                                                    </p>
                                                </div>

                                                {/* Transcription metadata */}
                                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                    {transcription.language && (
                                                        <span>
                                                            {t('voice.language')}: {transcription.language}
                                                        </span>
                                                    )}
                                                    {transcription.confidence && (
                                                        <span>
                                                            {t('voice.confidence')}:{' '}
                                                            {Math.round(transcription.confidence * 100)}%
                                                        </span>
                                                    )}
                                                    {transcription.duration && (
                                                        <span>
                                                            {t('voice.duration')}: {transcription.duration.toFixed(1)}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Form>
        </div>
    );
}
