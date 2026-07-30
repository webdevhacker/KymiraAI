import OpenAI from 'openai';
import { Memory } from '../models/Memory';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const getMemories = async (userId: string): Promise<string[]> => {
  try {
    const memory = await Memory.findOne({ userId });
    return memory?.facts ?? [];
  } catch {
    return [];
  }
};

export const extractAndStoreMemories = async (
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> => {
  try {
    // OpenRouter free fast model for extraction
    const completion = await openai.chat.completions.create({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: `Extract important, reusable personal facts about the user from this snippet.
Return ONLY a valid JSON object like: { "facts": ["User's name is Alice", "Prefers Python"] }
Return { "facts": [] } if there are no memorable personal facts. Keep facts under 100 chars.`
        },
        {
          role: 'user',
          content: `User: ${userMessage.substring(0, 500)}\nAssistant: ${assistantResponse.substring(0, 500)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return;

    const parsed = JSON.parse(content) as { facts?: string[] };
    const newFacts = parsed.facts || [];
    if (newFacts.length === 0) return;

    const existing = await Memory.findOne({ userId });
    const existingFacts = existing?.facts ?? [];
    const toAdd = newFacts.filter((f) => !existingFacts.includes(f));

    if (toAdd.length === 0) return;

    await Memory.findOneAndUpdate(
      { userId },
      { $push: { facts: { $each: toAdd, $slice: -40 } } },
      { upsert: true }
    );
  } catch (err) {
    // Memory extraction is best effort
  }
};
