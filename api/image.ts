import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { text, type } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // Verify if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[Image API] OPENAI_API_KEY is not configured on the server. Returning null.");
      return res.status(200).json({ image: null });
    }

    // Create a beautiful theme-specific prompt for abstract backgrounds
    // Make sure we demand "no text" or "no words" so it doesn't try to draw text
    let themePrompt = "";
    if (type === 'affirmation') {
      themePrompt = "Serene and gentle abstract background with soft amber, golden sand, and cream watercolor washes. Minimalist spiritual vibe, peaceful light rays, completely blank with no text, letters, words, or borders.";
    } else if (type === 'verse') {
      themePrompt = "Calm and peaceful abstract background with gentle sky blue, warm sand, and light gold watercolor tones. Minimalist spiritual morning sky aesthetic, completely blank with no text, letters, words, or borders.";
    } else { // prayer
      themePrompt = "Contemplative and comforting abstract background with soft lavender, pale cream, and subtle gold dust watercolor washes. Quiet twilight spiritual vibe, completely blank with no text, letters, words, or borders.";
    }

    console.log(`[Image API] Calling OpenAI DALL-E 2 with prompt for type: ${type}`);
    
    // Generate image
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: themePrompt,
      n: 1,
      size: "512x512",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.warn("[Image API] OpenAI returned empty image data.");
      return res.status(200).json({ image: null });
    }

    console.log("[Image API] Image generated. Fetching and proxying as Base64 to bypass CORS...");

    // Fetch the image binary and convert to Base64 to prevent Canvas CORS tainting on frontend
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    console.log("[Image API] Base64 conversion successful. Returning response.");
    return res.status(200).json({ image: base64Image });
  } catch (error: any) {
    console.error("[Image API] Error generating image background:", error);
    return res.status(200).json({ image: null, error: error.message || '' });
  }
}
