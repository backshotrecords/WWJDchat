import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Configure Vercel to disable JSON/urlencoded body parsing
// so we can read the raw binary audio stream from the request.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read raw request body as Buffer
async function getRawBody(readable: any): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // If OpenAI API key is not configured, return a mock translation
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        text: "I am trying to find peace and quiet in a busy work environment."
      });
    }

    // Read the raw binary audio buffer
    const audioBuffer = await getRawBody(req);

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: "Empty audio body" });
    }

    // Convert Buffer to a File object for OpenAI SDK
    const audioFile = await toFile(audioBuffer, 'whisper_audio.webm', { type: 'audio/webm' });

    // Call Whisper Speech-to-Text API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return res.status(200).json({ text: transcription.text });
  } catch (error: any) {
    console.error("Whisper API call error:", error);
    return res.status(500).json({
      error: 'An error occurred during speech-to-text transcription.',
      details: error.message || ''
    });
  }
}
