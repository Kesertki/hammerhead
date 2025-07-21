# Whisper Docker Setup

This document provides instructions for setting up a Docker environment for Whisper, a speech recognition model used by Hammerhead for audio transcription.

## Overview

Hammerhead integrates OpenAI Whisper for speech-to-text transcription through a Docker-based approach. This provides better deployment flexibility and avoids local installation requirements.

## Build the Docker Image

Navigate to the directory containing your Dockerfile and run the following command to build the Docker image:

```bash
cd docker/whisper
docker build -t whisper .
```

## Integration with Hammerhead

Once the Docker image is built, Hammerhead will automatically use it for audio transcription. The app will:

1. Check if Docker is available (`docker --version`)
2. Verify the Whisper image exists (`docker images -q whisper`)
3. Run transcription using the Docker container with the 'tiny' model by default

## Voice Recording Workflow

1. **Record Audio**: Use the Voice page to record audio with the built-in recorder
2. **Auto-save**: Audio is automatically saved to `userData/cache/audio/` with UUID filename
3. **Auto-transcribe**: If Docker and Whisper are available, transcription starts automatically
4. **Display Results**: Transcribed text appears with copy functionality
5. **Manual Controls**: Re-transcribe or copy text as needed

## Manual Testing

You can manually test the Whisper Docker container using the following command:

```bash
docker run --rm -v $(pwd):/app whisper /app/dummy.webm --model=tiny --output_format=json --language=en --output_dir=/app
```

This command:

- Mounts the current directory to `/app` in the container
- Runs the Whisper model on `dummy.webm`
- Uses the "tiny" model (which is the default in Hammerhead)
- Outputs JSON format results
- Removes the container after execution (`--rm`)

## Automatic Usage in Hammerhead

When you record audio in Hammerhead's Voice page, the app will automatically:

1. Save the audio file to the cache directory
2. Run the Docker command: `docker run --rm -v <audio-dir>:/app whisper /app/<audio-file> --model=tiny --output_format=json --output_dir=/app`
3. Parse the JSON output and display the transcribed text
4. Clean up temporary files

## Features

- **Microphone Permissions**: Handles system microphone permissions
- **Multiple Audio Formats**: Supports WebM, MP4, OGG, WAV, MP3
- **Real-time Feedback**: Shows recording duration and auto-stops at limit
- **Error Handling**: Comprehensive error messages for different failure scenarios
- **Binary Data Transmission**: Custom IPC serialization for audio data
- **File Management**: UUID-based naming, metadata tracking, cleanup utilities
- **Availability Checking**: Detects Docker and Whisper image presence
- **Default Model**: Uses 'tiny' model for fast transcription

## Troubleshooting

### "Docker not available" Error

- Make sure Docker is installed and running
- Verify with: `docker --version`

### "Whisper Docker image not found" Error

- Build the image: `docker build -t whisper .`
- Verify with: `docker images | grep whisper`

### Permission Issues

- Ensure Docker has permissions to access the audio cache directory
- On Linux/macOS, you may need to adjust file permissions

### Transcription Fails

- Check Docker logs: `docker logs <container-id>`
- Verify audio file exists and is readable
- Ensure sufficient disk space for temporary files

Example output will be saved in the current directory as `dummy.json`:

```json
{
 "text": " Two years later.",
 "segments": [
  {
   "id": 0,
   "seek": 0,
   "start": 0.0,
   "end": 2.0,
   "text": " Two years later.",
   "tokens": [50364, 4453, 924, 1780, 13, 50464],
   "temperature": 0.0,
   "avg_logprob": -0.8369435582842145,
   "compression_ratio": 0.6666666666666666,
   "no_speech_prob": 0.0634918212890625
  }
 ],
 "language": "en"
}
```
