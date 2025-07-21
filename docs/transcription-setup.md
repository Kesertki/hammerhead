# Audio Transcription Setup

This document explains how to set up audio transcription in Hammerhead using OpenAI Whisper.

## Prerequisites

### Option 1: Install via pip (Recommended)

```bash
pip install openai-whisper
```

### Option 2: Install via conda

```bash
conda install -c conda-forge openai-whisper
```

### Option 3: Install from source

```bash
pip install git+https://github.com/openai/whisper.git
```

## Verify Installation

After installation, verify that Whisper is available:

```bash
whisper --help
```

You should see the Whisper help output if installation was successful.

## Available Models

Whisper comes with several models of different sizes and capabilities:

| Model  | Parameters | English-only | Multilingual | Required VRAM | Relative Speed |
|--------|------------|--------------|--------------|---------------|----------------|
| tiny   | 39 M       | tiny.en      | tiny         | ~1 GB         | ~32x (default) |
| base   | 74 M       | base.en      | base         | ~1 GB         | ~16x           |
| small  | 244 M      | small.en     | small        | ~2 GB         | ~6x            |
| medium | 769 M      | medium.en    | medium       | ~5 GB         | ~2x            |
| large  | 1550 M     | N/A          | large        | ~10 GB        | 1x             |

**Note**: Hammerhead uses the "tiny" model by default for fastest processing. You can configure different models if needed.

## Usage in Hammerhead

1. **Record Audio**: Use the voice recorder to capture audio
2. **Auto-transcription**: If Whisper is available, transcription will start automatically
3. **Manual Transcription**: Click the "Transcribe Audio" button to transcribe saved recordings
4. **View Results**: The transcribed text will appear below the recorder
5. **Copy Text**: Use the copy button to copy the transcribed text to clipboard

## Troubleshooting

### Common Issues

**"whisper: command not found"**

- Make sure Whisper is installed and available in your PATH
- Try restarting your terminal/application

**"Permission denied" errors**

- Ensure you have write permissions to the audio cache directory
- Check that temporary files can be created

**Slow transcription**

- Use a smaller model (tiny, base) for faster processing
- Consider using English-only models (.en) if transcribing English audio

**Poor accuracy**

- Try a larger model (small, medium, large)
- Ensure good audio quality (minimal background noise)
- Speak clearly and at moderate pace

### Performance Tips

1. **Choose the right model**: Balance between speed and accuracy
2. **Audio quality**: Better input audio = better transcription
3. **Language detection**: Specify language if known for better performance
4. **Batch processing**: Process multiple files together when possible

## Technical Details

- Audio files are temporarily stored in `userData/cache/audio`
- Transcription results are processed as JSON and cleaned up automatically
- The system supports multiple audio formats (webm, mp4, wav, etc.)
- Transcription runs as a child process to avoid blocking the UI

## Supported Languages

Whisper supports transcription in many languages including:
English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, and many more.

For a complete list, see the [Whisper documentation](https://github.com/openai/whisper#available-models-and-languages).
