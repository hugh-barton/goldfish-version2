const { OpenAI } = require('openai');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// We'll initialize OpenAI later, when we know the API key exists
let openai = null;

// Helper to get OpenAI client
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

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

  console.log('=== TRANSCRIPTION REQUEST START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Log environment variable status
  console.log('OPENAI_API_KEY status:', process.env.OPENAI_API_KEY ? '[PRESENT]' : '[MISSING]');
  console.log('Environment check:', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    keyStart: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 3) + '...' : 'N/A'
  });

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OpenAI API key is not configured');
    return res.status(500).json({ 
      error: 'OpenAI API key is not configured',
      details: 'Please set OPENAI_API_KEY environment variable in Vercel dashboard'
    });
  }

  console.log('OpenAI API key: [PRESENT]');

  try {
    const { files } = await parseForm(req);
    const audioFile = files.file;

    console.log('Parsed form data:', { 
      hasFile: !!audioFile,
      fileName: audioFile?.originalFilename || audioFile?.name || 'unknown',
      fileSize: audioFile?.size || 0,
      fileType: audioFile?.mimetype || 'unknown',
      filePath: audioFile?.filepath || 'unknown'
    });

    if (!audioFile) {
      console.error('ERROR: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if file exists
    if (!audioFile.filepath || !fs.existsSync(audioFile.filepath)) {
      console.error('ERROR: Uploaded file does not exist at path:', audioFile.filepath);
      return res.status(500).json({ error: 'Uploaded file could not be accessed' });
    }

    // Check if file is audio
    if (!audioFile.mimetype || !audioFile.mimetype.startsWith('audio/')) {
      console.error('ERROR: Invalid file type:', audioFile.mimetype);
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

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      console.error('ERROR: File too large:', audioFile.size, 'bytes (max:', maxSize, 'bytes)');
      return res.status(413).json({ error: 'File size exceeds 100MB limit' });
    }

    // Initialize OpenAI with detailed logging
    console.log('Getting OpenAI client...');
    const openaiClient = getOpenAI();

    console.log('Calling OpenAI Whisper API...');
    
    // Transcribe using OpenAI Whisper
    const transcription = await openaiClient.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    console.log('Whisper API call successful:', {
      duration: transcription.duration,
      language: transcription.language,
      segmentsCount: transcription.segments ? transcription.segments.length : 0
    });

    // Clean up the uploaded file
    if (fs.existsSync(audioFile.filepath)) {
      console.log('Cleaning up uploaded file...');
      fs.unlinkSync(audioFile.filepath);
    }

    console.log('=== TRANSCRIPTION REQUEST SUCCESS ===');
    res.status(200).json(transcription);

  } catch (error) {
    console.error('=== TRANSCRIPTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    console.error('Error type:', error.constructor.name);
    
    // Log additional OpenAI-specific error details
    if (error.response) {
      console.error('OpenAI API response status:', error.response.status);
      console.error('OpenAI API response data:', error.response.data);
    }
    
    // Clean up any files if they exist
    if (req.file && req.file.filepath && fs.existsSync(req.file.filepath)) {
      console.log('Cleaning up file after error...');
      fs.unlinkSync(req.file.filepath);
    }
    
    const errorMessage = error.message || 'Transcription failed';
    console.log('=== END TRANSCRIPTION ERROR ===');
    
    res.status(500).json({ 
      error: 'Transcription failed',
      details: errorMessage,
      errorType: error.constructor.name
    });
  }
}