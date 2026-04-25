import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [customTrigger, setCustomTrigger] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [clips, setClips] = useState([]);
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
      setAudioFile(file);
      setClips([]);
      setTranscripts([]);
    } else {
      alert('Please upload an audio file');
    }
  };

  const processAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Upload and transcribe audio using Whisper
      setProgress(20);
      const formData = new FormData();
      formData.append('file', audioFile);
      
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const transcription = response.data;
      
      setProgress(50);
      
      // Step 2: Detect triggers
      const detectedTriggers = detectTriggers(transcription);
      
      if (detectedTriggers.length === 0) {
        setProgress(100);
        alert('No triggers detected in the audio. Try using different trigger words or speak more clearly.');
        return;
      }
      
      setProgress(70);
      
      // Step 3: Generate clips
      const clipResponse = await axios.post('/api/generate-clips', {
        filePath: audioFile.name,
        triggers: detectedTriggers,
        originalFileName: audioFile.name
      });
      
      setProgress(100);
      setClips(clipResponse.data.clips);
      setTranscripts([transcription]);
      
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
      const end = segment.end;

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
        <p>Find the golden moments in your audio recordings</p>
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
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div className="upload-content">
              <svg className="upload-icon" viewBox="0 0 24 24">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              <p>{audioFile ? audioFile.name : 'Click to upload audio file'}</p>
              <p className="upload-hint">Supports MP3, WAV, M4A and other audio formats</p>
            </div>
          </div>

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

          <button 
            className="process-button"
            onClick={processAudio}
            disabled={!audioFile || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Find Golden Moments'}
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

        {clips.length > 0 && (
          <div className="clips-section">
            <h2>Found {clips.length} Golden Moments</h2>
            <div className="clips-list">
              {clips.map((clip, index) => (
                <div key={index} className="clip-item">
                  <div className="clip-info">
                    <span className="clip-time">{formatTime(clip.timestamp)}</span>
                    <span className={`clip-trigger ${clip.isExcitement ? 'excitement' : ''}`}>
                      {clip.trigger}
                    </span>
                  </div>
                  <div className="clip-preview">
                    <audio controls src={clip.url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  <div className="clip-actions">
                    <button 
                      className="download-btn"
                      onClick={() => {
                        // Create blob from base64 data
                        const binaryString = window.atob(clip.url.split(',')[1]);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'audio/mp3' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = clip.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;