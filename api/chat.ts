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
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages parameter' });
    }

    // Verify if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        text: "[Mock Response - API Key Not Configured on Server] The network is quiet, but remember to let your actions be seasoned with grace and patience."
      });
    }

    // Format our messages array into the format OpenAI expects: { role, content }
    const formattedMessages = messages.map((m: any) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

    // Inject system persona prompt
    const systemPrompt = {
      role: 'system' as const,
      content: `You are the "What Would Jesus Do?" AI guide. Your purpose is to provide warm, Biblical-based insight, comfort, and wisdom into everyday situations.
Your tone should be soft, compassionate, reflective, and deeply encouraging. Help the user feel invited to share, open up, and find peace.
Focus on teaching grace, patience, love, peace, and understanding. Reassure the user of their value. Keep your responses relatively concise, warm, and structured to invite reflection.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 250,
    });

    const aiResponseText = completion.choices[0]?.message?.content || "I am reflecting on this. Take a moment of quiet prayer and seek guidance.";

    return res.status(200).json({ text: aiResponseText });
  } catch (error: any) {
    console.error("OpenAI API call error:", error);
    return res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: error.message || ''
    });
  }
}
