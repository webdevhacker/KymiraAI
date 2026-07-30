import { apiClient, getAuthHeaders } from './client';
import type { SSEEvent } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface StreamChatParams {
  message: string;
  conversationId?: string;
  model: string;
  enableWebSearch: boolean;
  file?: File;
}

/**
 * Stream chat via SSE using raw fetch (EventSource doesn't support POST).
 * Calls onEvent for each parsed SSE event.
 */
export const streamChat = async (
  params: StreamChatParams,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  const formData = new FormData();
  formData.append('message', params.message);
  if (params.conversationId) formData.append('conversationId', params.conversationId);
  formData.append('model', params.model);
  formData.append('enableWebSearch', String(params.enableWebSearch));
  if (params.file) formData.append('file', params.file);

  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const event = JSON.parse(data) as SSEEvent;
        onEvent(event);
      } catch {
        // Malformed JSON — skip
      }
    }
  }
};

export const generateImage = async (
  prompt: string,
  size: string
): Promise<{ imageUrl: string; prompt: string }> => {
  const { data } = await apiClient.post<{
    success: boolean;
    imageUrl: string;
    prompt: string;
  }>('/chat/image', { prompt, size });
  return { imageUrl: data.imageUrl, prompt: data.prompt };
};
