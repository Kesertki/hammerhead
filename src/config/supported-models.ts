export interface ModelDetails {
    title: string;
    description: string;
    size: number;
    author: string;
    authorUrl: string;
    modelUrl: string;
    downloadLink: string;
    variants: string[];
}

// \"hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF:Q6_K_L\" \"hf:bartowski/Qwen_Qwen3-4B-Thinking-2507-GGUF:Q6_K_L\"

export const SUPPORTED_MODELS: ModelDetails[] = [
    {
        title: 'Qwen3-4B-Instruct-2507',
        description: 'A 4B instruction-tuned version of the Qwen model.',
        size: 4,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/bartowski',
        modelUrl: 'https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF',
        downloadLink:
            'https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Instruct-2507-Q6_K_L.gguf',
        variants: ['Q6_K_L'],
    },
    {
        title: 'Qwen3-4B-Thinking-2507',
        description: 'A 4B thinking-optimized version of the Qwen model.',
        size: 4,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/bartowski',
        modelUrl: 'https://huggingface.co/bartowski/Qwen_Qwen3-4B-Thinking-2507-GGUF',
        downloadLink:
            'https://huggingface.co/bartowski/Qwen_Qwen3-4B-Thinking-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Thinking-2507-Q6_K_L.gguf',
        variants: ['Q6_K_L'],
    },
    {
        title: 'Qwen3-8B',
        description: 'A 8B parameter version of the Qwen model.',
        size: 8,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-8B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q6_K.gguf',
        variants: ['Q6_K'],
    },
    {
        title: 'Qwen3-4B',
        description: 'A 4B parameter version of the Qwen model.',
        size: 4,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-4B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Qwen3-1.7B',
        description: 'A 1.7B parameter version of the Qwen model.',
        size: 1.7,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-1.7B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q8_0.gguf',
        variants: ['Q8_0'],
    },
    {
        title: 'Qwen3-0.6B',
        description: 'A 0.6B parameter version of the Qwen model.',
        size: 0.6,
        author: 'Qwen',
        authorUrl: 'https://huggingface.co/Qwen',
        modelUrl: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF',
        downloadLink: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
        variants: ['Q8_0'],
    },
    {
        title: 'DeepSeek R1 Distill Qwen 7B',
        description: 'A distilled version of the Qwen model optimized for performance.',
        size: 7,
        author: 'team mradermacher',
        authorUrl: 'https://huggingface.co/mradermacher',
        modelUrl: 'https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF',
        downloadLink:
            'https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B.Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Meta Llama 3.1 8B Instruct',
        description: 'An 8B instruction-tuned version of the Meta Llama 3.1 model.',
        size: 8,
        author: 'team mradermacher',
        authorUrl: 'https://huggingface.co/mradermacher',
        modelUrl: 'https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF',
        downloadLink:
            'https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
    {
        title: 'Gemma 2 2B',
        description: 'A 2B parameter version of the Gemma 2 model.',
        size: 2,
        author: 'Bartowski',
        authorUrl: 'https://huggingface.co/bartowski',
        modelUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF',
        downloadLink: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
        variants: ['Q4_K_M'],
    },
];
