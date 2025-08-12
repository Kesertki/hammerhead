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
import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

const languages = [
    { value: 'en', label: 'English' },
    { value: 'uk', label: 'Ukrainian' },
];

const FormSchema = z.object({
    enabled: z.boolean(),
    language: z.string({
        required_error: 'Please select a language.',
    }),
});

interface GeneralSettings {
    enabled: boolean;
    language: string;
}

export const GeneralSettings = () => {
    // const state = useExternalState(llmState);
    const [langOpen, setLangOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<GeneralSettings>({
        enabled: true,
        language: 'en',
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            language: 'en',
        },
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
            // const loadedSettings = await window.electronAPI.getGeneralSettings();
            // if (loadedSettings) {
            // setSettings(loadedSettings);
            // }
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
                enabled: settings.enabled,
                language: settings.language,
            });
        }
    }, [settings, form]);

    return (
        <div className="h-full flex flex-col mx-auto p-4">
            {/* <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">General Settings</h2> */}
            {/* <p>Version: {state.appVersion}</p> */}
            {/* Add more general settings here */}
            <Form {...form}>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-4">Loading settings...</div>
                    ) : (
                        <>
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className={!isEnabled ? 'text-muted-foreground' : ''}>
                                            Language
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
                                                            : 'Select language'}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search language..." className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>No language found.</CommandEmpty>
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
                                            This is the language that will be used for the application interface.
                                        </FormDescription>
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
