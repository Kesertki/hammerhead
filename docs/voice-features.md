# Voice Recording and Transcription

This document describes the voice recording and transcription features in Hammerhead.

## Features

- **Audio Recording**: Record high-quality audio using your microphone
- **Persistent Storage**: Audio files are saved to `userData/cache/audio`
- **Speech-to-Text**: Automatic transcription using OpenAI Whisper
- **Multiple Formats**: Support for WebM, MP4, WAV, and other audio formats
- **Real-time Feedback**: Visual indicators and duration tracking
- **Copy to Clipboard**: Easy text copying from transcription results

## Usage

### Recording Audio

1. Navigate to the Voice page in Hammerhead
2. Click the microphone button to start recording
3. Speak clearly into your microphone
4. Click the stop button or wait for auto-stop (10-second limit)
5. The audio is automatically saved to persistent storage

### Transcription

If OpenAI Whisper is installed:

1. After recording, transcription starts automatically
2. Or click "Transcribe Audio" to manually transcribe
3. View the transcribed text in the results card
4. Copy the text using the copy button

### System Requirements

- **Microphone Access**: Required for audio recording
- **OpenAI Whisper**: Optional, for speech-to-text functionality
- **Storage Space**: Audio files are stored in app data directory

## Installation

### For Transcription (Optional)

Install OpenAI Whisper for speech-to-text functionality:

```bash
pip install openai-whisper
```

See [transcription-setup.md](./transcription-setup.md) for detailed setup instructions.

## Technical Details

### Audio Storage

- **Location**: `{userData}/cache/audio/`
- **Naming**: UUID-based unique filenames
- **Metadata**: Duration, size, MIME type, creation date
- **Cleanup**: Automatic management of storage space

### Recording Settings

- **Sample Rate**: 44.1 kHz (CD quality)
- **Channels**: Mono recording
- **Format**: WebM with Opus codec (preferred)
- **Bitrate**: 128 kbps
- **Duration Limit**: 10 seconds (configurable)

### Audio Enhancement

- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled  
- **Auto Gain Control**: Enabled
- **Permission Handling**: Automatic microphone permissions

### Transcription Process

1. Audio file saved to cache directory
2. Whisper child process spawned with "tiny" model (default)
3. JSON transcription result generated
4. Text extracted and displayed
5. Temporary files cleaned up

**Default Model**: Uses Whisper "tiny" model for fast processing (~32x realtime speed)

## API Reference

### AudioStorageService

```typescript
// Save audio blob
AudioStorageService.saveAudio(blob: Blob, duration: number): Promise<AudioMetadata>

// Transcribe audio file (defaults to "tiny" model)
AudioStorageService.transcribeAudio(filePath: string, model?: string): Promise<TranscriptionResult>

// Check transcription availability
AudioStorageService.checkTranscriptionAvailability(): Promise<boolean>

// Get all audio files
AudioStorageService.getAllAudioFiles(): Promise<AudioMetadata[]>

// Delete audio file
AudioStorageService.deleteAudio(id: string): Promise<boolean>
```

### VoiceRecorder Component

```typescript
<VoiceRecorder
  durationLimit={10}           // Recording duration limit (seconds)
  showLabels={false}           // Show button labels
  showPlayer={true}            // Show audio player after recording
  onRecordingComplete={handler} // Callback when recording completes
/>
```

## Error Handling

The system includes comprehensive error handling for:

- **Microphone Access**: Permission denied, device not found
- **Audio Recording**: MediaRecorder errors, stream issues
- **File Storage**: Disk space, permissions, path issues
- **Transcription**: Whisper unavailable, processing errors
- **Network**: IPC communication, serialization issues

## Privacy and Security

- **Local Processing**: All audio stays on your device
- **No Cloud Services**: Transcription runs locally via Whisper
- **Temporary Storage**: Audio files managed automatically
- **Permissions**: Explicit microphone permission required

## Performance Considerations

- **Model Selection**: Choose appropriate Whisper model for speed vs accuracy
- **Storage Management**: Old audio files can be cleaned up manually
- **Memory Usage**: Large audio files may require more RAM for processing
- **CPU Usage**: Transcription is CPU-intensive, runs in background

## Troubleshooting

### Common Issues

1. **No Microphone Access**
   - Check browser/system permissions
   - Verify microphone is connected and working

2. **Recording Fails**
   - Close other applications using microphone
   - Restart browser/application

3. **Transcription Not Available**
   - Install Whisper: `pip install openai-whisper`
   - Verify installation: `whisper --help`

4. **Poor Transcription Quality**
   - Speak clearly and at moderate pace
   - Reduce background noise
   - Try a larger Whisper model

### Debug Tools

Use the browser developer console to access debug utilities:

```javascript
// Test audio storage
window.AudioDebugUtils.testAudioStorage()

// Test audio save
window.AudioDebugUtils.testSaveAudio()
```

## Future Enhancements

Planned features for future versions:

- **Multiple Language Support**: Language selection for transcription
- **Audio Playback Controls**: Enhanced player with seek/speed controls
- **Batch Transcription**: Process multiple files simultaneously
- **Export Options**: Save transcriptions to various formats
- **Voice Commands**: Use transcribed text for app commands
- **Real-time Transcription**: Live speech-to-text during recording
