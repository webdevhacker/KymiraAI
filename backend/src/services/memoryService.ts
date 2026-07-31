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
Also analyze the user's technical skills (languages, frameworks, concepts) demonstrated in the conversation and rate their proficiency from 1 to 100.
Return ONLY a valid JSON object matching this schema:
{ 
  "facts": ["User's name is Alice", "Prefers Python"],
  "skills": { "Python": 65, "React": 80, "System Design": 50 }
}
Return empty arrays/objects if nothing is detected. Keep facts under 100 chars.`
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

    const parsed = JSON.parse(content) as { facts?: string[], skills?: Record<string, number> };
    const newFacts = parsed.facts || [];
    const newSkills = parsed.skills || {};
    
    if (newFacts.length === 0 && Object.keys(newSkills).length === 0) return;

    const existing = await Memory.findOne({ userId });
    
    // Update Facts
    const existingFacts = existing?.facts ?? [];
    const toAdd = newFacts.filter((f) => !existingFacts.includes(f));
    
    // Update Skills
    const updateOps: any = {};
    if (toAdd.length > 0) {
      updateOps.$push = { facts: { $each: toAdd, $slice: -40 } };
    }
    
    if (Object.keys(newSkills).length > 0) {
      updateOps.$set = updateOps.$set || {};
      for (const [skill, score] of Object.entries(newSkills)) {
        if (typeof score !== 'number' || score < 1 || score > 100) continue;
        const currentScore = existing?.skills?.get(skill);
        // If skill exists, take a moving average. Otherwise set it.
        const updatedScore = currentScore ? Math.round((currentScore + score) / 2) : score;
        updateOps.$set[`skills.${skill}`] = updatedScore;
      }
    }

    if (Object.keys(updateOps).length === 0) return;

    await Memory.findOneAndUpdate(
      { userId },
      updateOps,
      { upsert: true, new: true }
    );
  } catch (err) {
    // Memory extraction is best effort
  }
};
