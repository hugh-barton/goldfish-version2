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

// Helper to parse form data - fixed for Vercel
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      uploadDir: '/tmp',
      keepExtensions: true,
      filename: (name, ext, part, form) => {
        // Ensure unique filename
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
      }
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

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key is not configured',
      details: 'Please set OPENAI_API_KEY environment variable in Vercel dashboard'
    });
  }

  try {
    const { files } = await parseForm(req);
    const audioFile = files.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if file is audio
    if (!audioFile.mimetype || !audioFile.mimetype.startsWith('audio/')) {
      // Clean up file if it exists
      if (audioFile.filepath && fs.existsSync(audioFile.filepath)) {
        fs.unlinkSync(audioFile.filepath);
      }
      return res.status(400).json({ error: 'Only audio files are allowed' });
    }

    console.log('Processing audio file:', {
      name: audioFile.originalFilename || audioFile.name,
      size: audioFile.size,
      type: audioFile.mimetype,
      path: audioFile.filepath
    });

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    // Clean up the uploaded file
    if (fs.existsSync(audioFile.filepath)) {
      fs.unlinkSync(audioFile.filepath);
    }

    res.status(200).json(transcription);

  } catch (error) {
    console.error('Transcription error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    });
    
    // Clean up any files if they exist
    if (req.file && req.file.filepath && fs.existsSync(req.file.filepath)) {
      fs.unlinkSync(req.file.filepath);
    }
    
    res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message 
    });
  }
}