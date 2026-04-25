const { OpenAI } = require('openai');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure formidable for Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse form data
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      uploadDir: '/tmp',
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    const audioFile = files.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if file is audio
    if (!audioFile.mimetype.startsWith('audio/')) {
      fs.unlinkSync(audioFile.filepath);
      return res.status(400).json({ error: 'Only audio files are allowed' });
    }

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    // Clean up the uploaded file
    fs.unlinkSync(audioFile.filepath);

    res.status(200).json(transcription);

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up any files if they exist
    if (req.file && fs.existsSync(req.file.filepath)) {
      fs.unlinkSync(req.file.filepath);
    }
    
    res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message 
    });
  }
}