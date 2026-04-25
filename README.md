# Goldfish - Find the Golden Moments in Your Audio

Goldfish is a web app that helps musicians and creators automatically find and extract the best moments from their long audio recordings.

## Features

- **Upload Audio**: Support for MP3, WAV, M4A and other common audio formats
- **AI Transcription**: Uses Whisper AI to transcribe your audio with timestamps
- **Smart Trigger Detection**: 
  - Detects explicit keywords like "Keeper", "Clip it", "That's the one"
  - Identifies implicit excitement signals like "that's it!", "oh wow", "yes!"
  - Support for custom trigger words
- **Auto-Clip Generation**: Automatically creates 60-second clips (30s before and after each trigger)
- **Preview & Download**: Preview clips before downloading individual moments

## Tech Stack

- **Frontend**: React 18 with Axios for API calls
- **Backend**: Vercel Serverless Functions with Node.js
- **AI Processing**: OpenAI Whisper API for transcription
- **Audio Processing**: FFmpeg for audio clip generation

## Vercel Deployment

### Prerequisites
- Node.js (v16 or higher)
- Vercel account
- OpenAI API key (for Whisper transcription)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Environment Variables
Create a `.env.local` file in your project root:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Deploy to Vercel
```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy the project
vercel

# Or deploy to production
vercel --prod
```

### 4. Configure Environment Variables in Vercel Dashboard
After deployment:
1. Go to your Vercel dashboard
2. Select your Goldfish project
3. Go to Settings → Environment Variables
4. Add your OpenAI API key:
   - Name: `OPENAI_API_KEY`
   - Value: `your_openai_api_key_here`
   - Environments: Production, Preview, Development
5. Redeploy your project

## Project Structure (Vercel Optimized)
```
goldfish-app/
├── api/                    # Vercel serverless functions
│   ├── transcribe.js      # Audio transcription endpoint
│   └── generate-clips.js # Clip generation endpoint
├── public/                # Static assets
├── src/                   # React source code
│   ├── App.js            # Main React component
│   ├── App.css           # App styles
│   └── ...
├── vercel.json           # Vercel configuration
├── package.json
└── README.md
```

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run Locally with Vercel
```bash
vercel dev
```

This will run both the frontend and API endpoints locally on `http://localhost:3000`.

## How to Use

1. **Upload Audio**: Click the upload area or drag and drop an audio file
2. **Set Custom Trigger (Optional)**: Enter your own trigger word like "Banger" or "Keep"
3. **Process**: Click "Find Golden Moments" to start the analysis
4. **Review Results**: Browse through detected moments with timestamps
5. **Preview & Download**: Listen to each clip and download the ones you like

## Trigger Words

### Default Keywords
- Keeper
- Clip it
- That's the one
- Gold
- Nice

### Excitement Signals
- That's it
- Yes!
- That's the moment
- Oh wow
- Got it
- Perfect
- Amazing
- Incredible
- Yes yes yes
- Boom

## API Endpoints (Vercel Functions)

### POST /api/transcribe
Upload and transcribe an audio file.

**Request:**
```http
POST /api/transcribe
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "text": "Full transcription text",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 1.0,
      "text": "Hello world",
      "tokens": [...],
      "temperature": 0.0,
      "avg_logprob": -0.1,
      "compression_ratio": 1.0,
      "no_speech_prob": 0.1
    }
  ]
}
```

### POST /api/generate-clips
Generate audio clips based on trigger timestamps.

**Request:**
```http
POST /api/generate-clips
Content-Type: application/json

{
  "filePath": "audio-filename.mp3",
  "triggers": [
    {
      "trigger": "keeper",
      "timestamp": 30.5,
      "text": "keeper this one",
      "isExcitement": false
    }
  ]
}
```

**Response:**
```json
{
  "clips": [
    {
      "trigger": "keeper",
      "timestamp": 30.5,
      "text": "keeper this one",
      "isExcitement": false,
      "url": "data:audio/mp3;base64,...",
      "filename": "goldfish-moment-30.5s-keeper.mp3"
    }
  ]
}
```

## Cost Considerations

- **OpenAI Whisper**: $0.006 per minute (as of 2024)
- **Vercel Functions**: Free tier includes 100GB bandwidth and serverless function execution
- **Storage**: Clips are returned as base64, no additional storage costs

## Limitations

- Maximum file size: 100MB (Vercel limitation)
- Supported audio formats: MP3, WAV, M4A, and others supported by Whisper
- Processing time depends on audio length and OpenAI API response time

## Future Enhancements

- [ ] Support for larger files with external storage (S3, etc.)
- [ ] User accounts to save clips
- [ ] Batch processing
- [ ] Adjustable clip duration
- [ ] Export playlist of all clips
- [ ] Advanced trigger configuration
- [ ] Visual waveform display
- [ ] Collaborative sharing

## License

MIT License - feel free to use this for your creative projects!