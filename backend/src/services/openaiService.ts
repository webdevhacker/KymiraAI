import OpenAI from 'openai';
import { Response } from 'express';
import { webSearch } from './searchService';

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ─── Pollinations.ai image URL (100% free, no API key) ───────────────────────
export const buildPollinationsUrl = (prompt: string, size = '1024x1024'): string => {
  const [width, height] = size.split('x');
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux&seed=${Date.now()}`;
};

// ─── Tool definitions ────────────────────────────────────────────────────────
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current, real-time information.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Generate an image from a text description.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          size: { type: 'string', enum: ['1024x1024', '1792x1024', '1024x1792'] },
        },
        required: ['prompt', 'size'],
      },
    },
  },
];

// ─── Main streaming function ──────────────────────────────────────────────────
export const streamChat = async ({
  messages,
  model,
  enableWebSearch,
  memories,
  res,
}: {
  messages: OpenAI.ChatCompletionMessageParam[];
  model: string;
  enableWebSearch: boolean;
  memories: string[];
  res: Response;
}): Promise<string> => {
  let systemPrompt = `You are KymiraAI, a highly capable AI coding assistant.
You are an expert software engineer. Your primary focus is on writing, debugging, and explaining code.
You have tools to search the web and generate images. Use markdown for formatting code blocks.
When you use the generate_image tool, the system will automatically display the image to the user. Do NOT output the image URL or any markdown image tags in your response. Simply tell the user that the image has been generated.
IMPORTANT: At the end of every response, you MUST ask a relevant follow-up question to the user to keep the conversation going and dive deeper into the technical implementation or their coding goals.`;

  if (memories.length > 0) {
    systemPrompt += `\n\n## What you remember about this user\n${memories.map((f) => `- ${f}`).join('\n')}`;
  }

  // Ensure system prompt is first
  const fullMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  let fullContent = '';

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Recursive stream to handle tool calls
  const doStream = async (msgs: OpenAI.ChatCompletionMessageParam[], depth = 0): Promise<void> => {
    if (depth > 5) return;

    const stream = await openai.chat.completions.create({
      model: model || 'openrouter/auto',
      messages: msgs,
      tools: enableWebSearch ? tools : [tools[1]],
      stream: true,
      ...({ include_reasoning: true } as any)
    });

    let toolCalls: any[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        fullContent += delta.content;
        send({ type: 'content', content: delta.content });
      }

      // @ts-ignore - OpenRouter specific reasoning field
      if (delta.reasoning) {
        // @ts-ignore
        send({ type: 'reasoning', content: delta.reasoning });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: tc.function?.name, arguments: '' } };
          }
          if (tc.function?.arguments) {
            toolCalls[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    if (toolCalls.length > 0) {
      msgs.push({ role: 'assistant', content: null, tool_calls: toolCalls });

      for (const call of toolCalls) {
        let result = '';
        const args = JSON.parse(call.function.arguments || '{}');

        if (call.function.name === 'web_search') {
          send({ type: 'searching', query: args.query });
          try {
            const searchRes = await webSearch(args.query);
            send({ type: 'search_results', results: searchRes });
            result = JSON.stringify(searchRes);
          } catch {
            send({ type: 'search_error', message: 'Search unavailable' });
            result = 'Search failed.';
          }
        }

        if (call.function.name === 'generate_image') {
          const size = args.size || '1024x1024';
          send({ type: 'generating_image', prompt: args.prompt });
          const imageUrl = buildPollinationsUrl(args.prompt, size);
          send({ type: 'image_generated', imageUrl, prompt: args.prompt });
          result = JSON.stringify({ success: true, imageUrl });
        }

        msgs.push({ role: 'tool', tool_call_id: call.id, content: result });
      }

      await doStream(msgs, depth + 1);
    }
  };

  await doStream(fullMessages);
  return fullContent;
};

// ─── Direct image generation ──────────────────────────────────────────────────
export const generateImageDirectly = (prompt: string, size: string): string =>
  buildPollinationsUrl(prompt, size);
