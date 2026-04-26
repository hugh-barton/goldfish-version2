const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Helper to generate audio clips using ffmpeg
async function generateAudioClip(inputPath, timestamp, fileExtension) {
  // Generate 30 seconds before and after the timestamp
  const startTime = Math.max(0, timestamp - 30);
  const duration = 60; // 30 seconds before + 30 seconds after
  
  const outputPath = path.join('/tmp', `clip_${Date.now()}_${timestamp}.mp3`);
  
  // Handle different audio formats - always convert to MP3 for consistency
  if (fileExtension.toLowerCase() === '.m4a' || fileExtension.toLowerCase() === '.mp4') {
    // For m4a files, convert to mp3 properly
    await execAsync(`\"${ffmpeg}\" -i \"${inputPath}\" -ss ${startTime} -t ${duration} -acodec libmp3lame -ab 192k \"${outputPath}\"`);
  } else {
    // For other formats, try to copy the codec first, fall back to conversion if that fails
    try {
      await execAsync(`\"${ffmpeg}\" -i \"${inputPath}\" -ss ${startTime} -t ${duration} -acodec copy \"${outputPath}\"`);
    } catch (copyError) {
      console.log('Codec copy failed, converting to MP3:', copyError.message);
      await execAsync(`\"${ffmpeg}\" -i \"${inputPath}\" -ss ${startTime} -t ${duration} -acodec libmp3lame -ab 192k \"${outputPath}\"`);
    }
  }
  
  return outputPath;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filePath, triggers, originalFileName } = req.body;
    
    if (!filePath || !triggers || !Array.isArray(triggers)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    // Reconstruct the input file path (assuming it's stored in /tmp)
    const inputPath = path.join('/tmp', path.basename(filePath));
    
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Original audio file not found' });
    }

    // Get the file extension for proper processing
    const fileExtension = path.extname(originalFileName || filePath).toLowerCase();
    
    const clips = [];
    
    for (const trigger of triggers) {
      try {
        const clipPath = await generateAudioClip(inputPath, trigger.timestamp, fileExtension);
        
        // Convert to base64 for response
        const clipBuffer = fs.readFileSync(clipPath);
        const base64Audio = clipBuffer.toString('base64');
        
        clips.push({
          ...trigger,
          url: `data:audio/mp3;base64,${base64Audio}`,
          filename: `goldfish-moment-${trigger.timestamp.toFixed(1)}s-${trigger.trigger.replace(/\s+/g, '-')}.mp3`
        });
        
        // Clean up the clip file
        fs.unlinkSync(clipPath);
        
      } catch (clipError) {
        console.error('Error generating clip for trigger:', trigger, clipError);
        // Continue with other triggers even if one fails
      }
    }

    // Clean up the original file
    fs.unlinkSync(inputPath);

    res.status(200).json({ clips });

  } catch (error) {
    console.error('Clip generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate clips',
      details: error.message 
    });
  }
}