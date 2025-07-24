import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const models = [
	{ label: 'Tiny (recommended)', value: 'tiny' },
	{ label: 'Base', value: 'base' },
	{ label: 'Small', value: 'small' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'Large', value: 'large' },
	{ label: 'Turbo', value: 'turbo' }
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
	{ label: 'Yoruba', value: 'yo' }
] as const;

const FormSchema = z.object({
	model: z.string({
		required_error: 'Please select a transcription model.'
	}),
	language: z.string({
		required_error: 'Please select a language.'
	})
});

export function VoiceSettings({
	onSettingsChange,
	settings,
	isLoading = false
}: {
	onSettingsChange?: (settings: { model: string; language: string }) => void;
	settings?: { model: string; language: string };
	isLoading?: boolean;
}) {
	const [langOpen, setLangOpen] = useState(false);
	const [modelOpen, setModelOpen] = useState(false);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			language: '',
			model: 'tiny'
		}
	});

	// Update form when settings prop changes
	useEffect(() => {
		if (settings) {
			form.reset({
				model: settings.model,
				language: settings.language
			});
		}
	}, [settings, form]);

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const newSettings = {
			model: data.model,
			language: data.language
		};
		// Notify parent component of the change
		onSettingsChange?.(newSettings);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{isLoading ? (
					<div className="text-center py-4">Loading settings...</div>
				) : (
					<>
						<FormField
							control={form.control}
							name="model"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Model</FormLabel>
									<Popover
										open={modelOpen}
										onOpenChange={setModelOpen}
									>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													className={cn(
														'w-[200px] justify-between',
														field.value ===
															undefined &&
															'text-muted-foreground'
													)}
												>
													{field.value !== undefined
														? models.find(
																(model) =>
																	model.value ===
																	field.value
															)?.label
														: 'Select model'}
													<ChevronsUpDown className="opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[200px] p-0">
											<Command>
												<CommandInput
													placeholder="Search model..."
													className="h-9"
												/>
												<CommandList>
													<CommandEmpty>
														No model found.
													</CommandEmpty>
													<CommandGroup>
														{models.map((model) => (
															<CommandItem
																value={
																	model.label
																}
																key={
																	model.value
																}
																onSelect={() => {
																	form.setValue(
																		'model',
																		model.value
																	);
																	setModelOpen(
																		false
																	);
																}}
															>
																{model.label}
																<Check
																	className={cn(
																		'ml-auto',
																		model.value ===
																			field.value
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
									<FormDescription>
										This is the model that will be used for
										the voice transcription.
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
									<FormLabel>Language</FormLabel>
									<Popover
										open={langOpen}
										onOpenChange={setLangOpen}
									>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													className={cn(
														'w-[200px] justify-between',
														field.value ===
															undefined &&
															'text-muted-foreground'
													)}
												>
													{field.value !== undefined
														? languages.find(
																(language) =>
																	language.value ===
																	field.value
															)?.label
														: 'Select language'}
													<ChevronsUpDown className="opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[200px] p-0">
											<Command>
												<CommandInput
													placeholder="Search language..."
													className="h-9"
												/>
												<CommandList>
													<CommandEmpty>
														No language found.
													</CommandEmpty>
													<CommandGroup>
														{languages.map(
															(language) => (
																<CommandItem
																	value={
																		language.label
																	}
																	key={
																		language.value
																	}
																	onSelect={() => {
																		form.setValue(
																			'language',
																			language.value
																		);
																		setLangOpen(
																			false
																		);
																	}}
																>
																	{
																		language.label
																	}
																	<Check
																		className={cn(
																			'ml-auto',
																			language.value ===
																				field.value
																				? 'opacity-100'
																				: 'opacity-0'
																		)}
																	/>
																</CommandItem>
															)
														)}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormDescription>
										This is the language that will be used
										for the voice transcription.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Save</Button>
					</>
				)}
			</form>
		</Form>
	);
}
