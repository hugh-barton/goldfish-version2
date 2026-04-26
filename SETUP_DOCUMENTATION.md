# Goldfish App - Complete Setup Documentation

## Overview
Goldfish is a web application for musicians and creators that automatically finds and extracts the best moments from long audio recordings using AI transcription and smart trigger detection.

## Tech Stack
- **Frontend**: React 18 with Axios for API calls
- **Backend**: Vercel serverless functions (Node.js)
- **AI Integration**: OpenAI Whisper API for audio transcription
- **Audio Processing**: FFmpeg for precise audio clip generation
- **File Handling**: Formidable for file uploads in serverless environment

## Key Features

### 1. Audio Upload & Processing
- **Supported Formats**: MP3, WAV, M4A (including iOS Voice Memos), AAC
- **File Size Limit**: 100MB (Vercel limitation)
- **Processing Flow**:
  1. User uploads audio file
  2. Audio is transcribed using OpenAI Whisper
  3. Trigger detection identifies golden moments
  4. 60-second clips are generated (30s before + 30s after each trigger)
  5. Clips are available for preview and download

### 2. Trigger Detection
The app detects two types of triggers:

**Default Keywords**:
- "keeper", "clip it", "that's the one", "gold", "nice"
- "that's it", "yes!", "oh wow", "got it", "perfect"

**Excitement Signals**:
- "that's it", "yes!", "that's the moment", "oh wow", "got it"
- "perfect", "amazing", "incredible", "yes yes yes", "boom"

**Custom Triggers**: Users can add their own trigger words

### 3. M4A/iOS Support
- **Native iOS Voice Memo Support**: Direct upload of .m4a files from iOS devices
- **Automatic Conversion**: M4A files are automatically converted to MP3 using FFmpeg with libmp3lame codec
- **Quality Preserved**: 192k bitrate ensures high-quality output
- **Fallback Mechanism**: For unsupported codecs, automatic conversion to MP3

## Project Structure

```
goldfish-version2/
├── src/
│   ├── App.js              # Main React component
│   ├── App.css             # Application styles
│   └── index.js            # React entry point
├── api/
│   ├── transcribe.js       # Whisper transcription endpoint
│   └── generate-clips.js  # Audio clip generation endpoint
├── public/                 # Static assets
├── package.json           # Dependencies
├── vercel.json           # Vercel configuration
├── README.md             # Project documentation
├── M4A_SUPPORT_UPDATE.md # M4A feature documentation
└── test_m4a_support.sh   # Testing script for M4A files
```

## API Endpoints

### `/api/transcribe`
- **Method**: POST
- **Purpose**: Transcribe audio using OpenAI Whisper
- **Input**: Multipart form with audio file
- **Output**: Transcription with word-level timestamps
- **Response Format**: Verbose JSON with segments

### `/api/generate-clips`
- **Method**: POST
- **Purpose**: Generate 60-second audio clips from triggers
- **Input**: JSON with filePath, triggers array, originalFileName
- **Output**: Array of clip objects with base64-encoded MP3 data
- **Features**: 
  - Handles M4A to MP3 conversion
  - Fallback mechanism for unsupported codecs
  - Error handling for individual clip failures

## Deployment

### Vercel Configuration
The app is designed for Vercel serverless deployment:

**vercel.json**:
```json
{
  "functions": {
    "api/transcribe.js": {
      "maxDuration": 30
    },
    "api/generate-clips.js": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables
- **OPENAI_API_KEY**: Required for Whisper transcription
  - Set in Vercel dashboard under Environment Variables
  - Must be added before deployment

### Deployment Steps
1. **Push to GitHub**: `git push origin main`
2. **Vercel Import**: 
   - Connect GitHub repository to Vercel
   - Import `goldfish-version2` project
   - Configure environment variables
3. **Deploy**: Vercel automatically deploys on push

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Setup
```bash
# Clone repository
git clone https://github.com/hugh-barton/goldfish-version2.git
cd goldfish-version2

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add OPENAI_API_KEY to .env.local

# Run locally
npm start
```

### Local API Testing
The API functions are designed for Vercel serverless environment. For local testing:
1. Use a local Express server or
2. Test API endpoints individually with tools like Postman

## Testing

### M4A Support Testing
Run the included test script:
```bash
./test_m4a_support.sh
```

This script will:
- Check if ffmpeg is available
- Create test audio files if needed
- Provide testing instructions

### Manual Testing
1. **Upload Different Formats**: Test MP3, WAV, M4A files
2. **Trigger Detection**: Use various trigger words
3. **Clip Generation**: Verify all clips download correctly
4. **iOS Voice Memos**: Test with actual iOS recordings

## Troubleshooting

### Common Issues

**1. "No triggers detected"**
- Ensure clear audio quality
- Use trigger words deliberately
- Check if custom trigger is correctly spelled

**2. "Upload failed"**
- Verify file is under 100MB
- Check file format is supported
- Ensure proper MIME type

**3. "Clip generation failed"**
- Check FFmpeg is properly installed
- Verify audio file is not corrupted
- Review Vercel function logs

**4. "Deployment issues"**
- Verify OPENAI_API_KEY is set in Vercel
- Check GitHub connection to Vercel
- Review deployment logs

## Performance Considerations

### Vercel Limitations
- **Max Duration**: 30s for transcription, 60s for clip generation
- **File Size**: 100MB maximum upload
- **Cold Starts**: First request may be slower

### Optimization Tips
- Keep audio files under 10 minutes for faster processing
- Use explicit triggers for better accuracy
- Test with smaller files first

## Future Enhancements

### Potential Features
- [ ] Multiple file batch processing
- [ ] Clip tagging and organization
- [ ] Social sharing capabilities
- [ ] Audio quality settings
- [ ] Cloud storage integration
- [ ] Real-time transcription display
- [ ] Advanced trigger customization

### Technical Improvements
- [ ] WebSocket progress updates
- [ ] Local storage for recent files
- [ ] Audio waveform visualization
- [ ] Advanced audio noise reduction
- [ ] Multi-language support

## Contributing

This project is maintained for musicians and creators to easily extract golden moments from their recordings. When contributing:

1. Test with real audio recordings
2. Ensure M4A/iOS compatibility
3. Follow the existing code style
4. Update documentation for new features

## Support

For issues or questions:
1. Check this documentation
2. Review GitHub issues
3. Test with the provided test script
4. Verify with different audio formats

---

**Last Updated**: April 26, 2026
**Version**: 2.0 with M4A/iOS Voice Memo Support