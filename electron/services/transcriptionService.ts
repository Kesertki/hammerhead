import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface TranscriptionResult {
    text: string;
    confidence?: number;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
        confidence?: number;
    }>;
}

export interface TranscriptionError {
    code: string;
    message: string;
    details?: string;
}

export class TranscriptionService {
    private static readonly WHISPER_MODELS = [
        'tiny',
        'tiny.en',
        'base',
        'base.en',
        'small',
        'small.en',
        'medium',
        'medium.en',
        'large',
    ];

    /**
     * Transcribe audio file using OpenAI Whisper via Docker
     */
    static async transcribeWithWhisper(
        audioFilePath: string,
        model: string = 'tiny',
        language?: string,
        dockerImage: string = 'whisper'
    ): Promise<TranscriptionResult> {
        try {
            console.log(`Starting Docker transcription of: ${audioFilePath} using image: ${dockerImage}`);

            // Verify audio file exists
            await fs.access(audioFilePath);

            // Get paths for Docker volume mounting
            const outputDir = path.dirname(audioFilePath);
            const audioFileName = path.parse(audioFilePath).name;
            const audioFileBaseName = path.basename(audioFilePath);
            const jsonOutputPath = path.join(outputDir, `${audioFileName}.json`);

            // Build Docker command for whisper
            const dockerArgs = [
                'run',
                '--rm', // Remove container after execution
                '-v',
                `${outputDir}:/app`, // Mount the audio directory
                dockerImage, // Use the provided Docker image name
                `/app/${audioFileBaseName}`, // Audio file path inside container
                '--model',
                model,
                '--output_format',
                'json',
                '--output_dir',
                '/app',
                '--task',
                'transcribe',
            ];

            // Add language if specified
            if (language) {
                dockerArgs.push('--language', language);
            }

            console.log(`Running Docker ${dockerImage} with args:`, dockerArgs);

            // Run docker command as child process
            const result = await this.runChildProcess('docker', dockerArgs, 60000); // 60 second timeout

            if (result.exitCode !== 0) {
                throw new Error(`Docker ${dockerImage} failed with exit code ${result.exitCode}: ${result.stderr}`);
            }

            // Read the generated JSON file
            const transcriptionData = await this.readTranscriptionJSON(jsonOutputPath);

            // Clean up the JSON file
            try {
                await fs.unlink(jsonOutputPath);
            } catch (error) {
                console.warn('Failed to clean up transcription JSON file:', error);
            }

            return transcriptionData;
        } catch (error) {
            console.error('Docker transcription failed:', error);
            throw error;
        }
    }

    /**
     * Check if Docker and Whisper container are available
     */
    static async checkWhisperAvailability(dockerImage: string = 'whisper'): Promise<boolean> {
        try {
            // First check if Docker is available
            const dockerResult = await this.runChildProcess('docker', ['--version'], 5000);
            if (dockerResult.exitCode !== 0) {
                console.log('Docker not available');
                return false;
            }

            // Check if specified Docker image exists
            const imageResult = await this.runChildProcess('docker', ['images', '-q', dockerImage], 5000);
            if (imageResult.exitCode !== 0 || !imageResult.stdout.trim()) {
                console.log(`Docker image '${dockerImage}' not found`);
                return false;
            }

            console.log(`Docker image '${dockerImage}' available`);
            return true;
        } catch (error) {
            console.log(`Docker image '${dockerImage}' availability check failed:`, error);
            return false;
        }
    }

    /**
     * Get available Whisper models
     */
    static getAvailableModels(): string[] {
        return [...this.WHISPER_MODELS];
    }

    /**
     * Run a child process and return the result
     */
    private static async runChildProcess(
        command: string,
        args: string[],
        timeoutMs: number = 30000
    ): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            // Set up timeout
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Process timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            // Collect stdout
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Collect stderr
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process exit
            child.on('close', (code) => {
                clearTimeout(timeout);
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr,
                });
            });

            // Handle process error
            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Read and parse the JSON transcription file
     */
    private static async readTranscriptionJSON(jsonPath: string): Promise<TranscriptionResult> {
        try {
            const content = await fs.readFile(jsonPath, 'utf8');
            const data = JSON.parse(content) as unknown;

            // Handle different JSON formats that Whisper might produce
            if (data && typeof data === 'object' && 'text' in data) {
                // Standard Whisper JSON format
                const whisperData = data as {
                    text: string;
                    language?: string;
                    duration?: number;
                    segments?: Array<{
                        start: number;
                        end: number;
                        text: string;
                        confidence?: number;
                    }>;
                };

                return {
                    text: whisperData.text.trim(),
                    language: whisperData.language,
                    duration: whisperData.duration,
                    segments: whisperData.segments?.map((seg) => ({
                        start: seg.start,
                        end: seg.end,
                        text: seg.text?.trim(),
                        confidence: seg.confidence,
                    })),
                };
            }

            if (Array.isArray(data) && data.length > 0) {
                // Array format - concatenate all text
                const segments = data as Array<{
                    text?: string;
                    start?: number;
                    end?: number;
                    confidence?: number;
                }>;

                const text = segments
                    .map((item) => item.text || '')
                    .join(' ')
                    .trim();
                return {
                    text,
                    segments: segments.map((item) => ({
                        start: item.start || 0,
                        end: item.end || 0,
                        text: item.text?.trim() || '',
                        confidence: item.confidence,
                    })),
                };
            }

            throw new Error('Unrecognized JSON format from Whisper');
        } catch (error) {
            console.error('Failed to read transcription JSON:', error);
            throw new Error(`Failed to parse transcription result: ${error}`);
        }
    }

    /**
     * Fallback transcription using ffmpeg + speech recognition
     */
    static async transcribeWithFallback(_audioFilePath: string): Promise<TranscriptionResult> {
        // This is a placeholder for alternative transcription methods
        // You could implement other services like Google Speech-to-Text, Azure, etc.
        throw new Error('Fallback transcription not implemented yet');
    }
}
