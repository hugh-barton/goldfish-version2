import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [customTrigger, setCustomTrigger] = useState('');
  const [clips, setClips] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const defaultTriggers = [
    "keeper", "clip it", "that's the one", "gold", "nice", 
    "that's it", "yes!", "oh wow", "got it", "perfect"
  ];

  const excitementTriggers = [
    "that's it", "yes!", "that's the moment", "oh wow", "got it",
    "perfect", "amazing", "incredible", "yes yes yes", "boom"
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      // Check for common audio formats including m4a
      const validTypes = [
        'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 
        'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac'
      ];
      
      if (validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.m4a') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
        setAudioFile(file);
        setClips([]);
      } else {
        alert('Please upload a supported audio file (MP3, WAV, M4A, or AAC)');
      }
    } else {
      alert('Please upload an audio file');
    }
  };

  const processAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(0);
    setClips([]);
    setTranscript(null);

    try {
      // Step 1: Upload and transcribe audio using Whisper
      setProgress(50);
      const formData = new FormData();
      formData.append('file', audioFile);
      
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const transcription = response.data;
      
      setProgress(100);
      setTranscript(transcription);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage = error.response?.data?.error || 'Error processing audio. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const detectTriggers = (transcription) => {
    const segments = transcription.segments || [];
    const triggers = [];
    const allTriggers = [...defaultTriggers];
    
    if (customTrigger.trim()) {
      allTriggers.push(customTrigger.toLowerCase().trim());
    }

    segments.forEach(segment => {
      const text = segment.text.toLowerCase();
      const start = segment.start;

      allTriggers.forEach(trigger => {
        if (text.includes(trigger.toLowerCase())) {
          triggers.push({
            trigger: trigger,
            timestamp: start,
            text: segment.text,
            isExcitement: excitementTriggers.includes(trigger.toLowerCase())
          });
        }
      });
    });

    return triggers;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🐠 Goldfish</h1>
        <p>Transcribe your audio recordings</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <div 
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,audio/aac"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div className="upload-content">
              <svg className="upload-icon" viewBox="0 0 24 24">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              <p>{audioFile ? audioFile.name : 'Click to upload audio file'}</p>
              <p className="upload-hint">Supports MP3, WAV, M4A (including iOS Voice Memos) and other audio formats</p>
            </div>
          </div>

          {/* Commenting out custom trigger input for now
          <div className="trigger-input">
            <label htmlFor="custom-trigger">Custom trigger word:</label>
            <input
              id="custom-trigger"
              type="text"
              value={customTrigger}
              onChange={(e) => setCustomTrigger(e.target.value)}
              placeholder="e.g., 'Banger', 'Keep', 'Star'"
            />
          </div>
          */}

          <button 
            className="process-button"
            onClick={processAudio}
            disabled={!audioFile || isProcessing}
          >
            {isProcessing ? 'Transcribing...' : 'Transcribe Audio'}
          </button>

          {isProcessing && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span>{progress}%</span>
            </div>
          )}
        </div>

        {/* Commenting out triggers info for now - will be restored when golden moments feature is enabled
        <div className="triggers-info">
          <h3>Detected Triggers</h3>
          <div className="trigger-lists">
            <div>
              <h4>Default Keywords</h4>
              <p>{defaultTriggers.join(', ')}</p>
            </div>
            <div>
              <h4>Excitement Signals</h4>
              <p>{excitementTriggers.join(', ')}</p>
            </div>
          </div>
        </div>
        */}

        {transcript && (
          <div className="transcript-section">
            <h2>Audio Transcript</h2>
            <div className="transcript-info">
              <p><strong>Duration:</strong> {formatTime(transcript.duration || 0)}</p>
              <p><strong>Language:</strong> {transcript.language || 'Detected automatically'}</p>
            </div>
            <div className="transcript-text">
              {transcript.segments && transcript.segments.length > 0 ? (
                transcript.segments.map((segment, index) => (
                  <div key={index} className="segment">
                    <span className="segment-time">[{formatTime(segment.start)}]</span>
                    <span className="segment-text">{segment.text}</span>
                  </div>
                ))
              ) : (
                <p>{transcript.text || 'No transcript available'}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;