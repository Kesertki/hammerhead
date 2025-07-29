import { Download, Search } from 'lucide-react';
import './ModelSelector.css';

export function ModelSelector() {
    return (
        <div className="loadModel">
            <div className="actions">
                <div className="title">DeepSeek R1 Distill Qwen model</div>
                <div className="links">
                    <a
                        target="_blank"
                        href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B.Q4_K_M.gguf"
                    >
                        <Download />
                        <div className="text">Get 7B</div>
                    </a>
                    <div className="separator" />
                    <a
                        target="_blank"
                        href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B.Q4_K_M.gguf"
                    >
                        <Download />
                        <div className="text">Get 14B</div>
                    </a>
                    <div className="separator" />
                    <a
                        target="_blank"
                        href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-32B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-32B.Q4_K_M.gguf"
                    >
                        <Download />
                        <div className="text">Get 32B</div>
                    </a>
                </div>

                <div className="separator" />
                <div className="title">Other models</div>
                <div className="links">
                    <a
                        target="_blank"
                        href="https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf"
                    >
                        <Download />
                        <div className="text">Get Llama 3.1 8B</div>
                    </a>
                    <div className="separator" />
                    <a
                        target="_blank"
                        href="https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf"
                    >
                        <Download />
                        <div className="text">Get Gemma 2 2B</div>
                    </a>
                </div>

                <div className="separator" />
                <a
                    className="browseLink"
                    target="_blank"
                    href="https://huggingface.co/models?pipeline_tag=text-generation&library=gguf&sort=trending"
                >
                    <Search />
                    <div className="text">Find more models</div>
                </a>
            </div>
        </div>
    );
}
