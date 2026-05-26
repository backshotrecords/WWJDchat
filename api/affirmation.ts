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
      return res.status(200).json({ text: null }); // Fallback on frontend
    }

    // Extract user and AI messages
    const userMessages = messages.filter((m: any) => m.sender === 'user' || m.role === 'user');
    const aiMessages = messages.filter((m: any) => m.sender === 'ai' || m.role === 'assistant');

    const lastUserMessage = userMessages[userMessages.length - 1]?.text || '';
    const lastAiResponse = aiMessages[aiMessages.length - 1]?.text || '';

    // If there is no user message, we can't summarize intention. Return null to trigger fallback
    if (!lastUserMessage) {
      return res.status(200).json({ text: null });
    }

    const promptText = `
You are a deeply compassionate pastor and spiritual mentor.
Review the following user situation and the AI's spiritual guidance:

User's Situation:
"${lastUserMessage}"

AI's Guidance:
"${lastAiResponse}"

Your task:
1. Summarize the core emotional/spiritual intention or struggle behind the user's message.
2. Summarize the intention and comfort behind the AI's reflection response.
3. Write a personalized, single, powerful, positive spiritual affirmation in the first person ("I am...", "I choose...", "I trust...").
4. The affirmation should speak directly to their specific struggle and the hope/guidance offered in the response, declaring peace, courage, patience, or strength.
5. The affirmation must be exactly 1 sentence and under 30 words.

Respond with ONLY the final affirmation text itself. Do not include any introductory or concluding text, quotation marks, or headers. Just the affirmation.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a spiritual companion. Respond with only the affirmation text.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const affirmationText = completion.choices[0]?.message?.content?.trim() || null;
    return res.status(200).json({ text: affirmationText });
  } catch (error: any) {
    console.error("OpenAI API error in affirmation endpoint:", error);
    // Return status 200 with null so frontend can gracefully fallback
    return res.status(200).json({ text: null, error: error.message || '' });
  }
}
