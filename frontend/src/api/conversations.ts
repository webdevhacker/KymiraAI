import { apiClient } from './client';
import type { Conversation, Message } from '../types';

export const conversationsApi = {
  getAll: async (): Promise<Conversation[]> => {
    const { data } = await apiClient.get<{ success: boolean; conversations: Conversation[] }>(
      '/conversations'
    );
    return data.conversations;
  },

  getWithMessages: async (
    id: string
  ): Promise<{ conversation: Conversation; messages: Message[] }> => {
    const { data } = await apiClient.get<{
      success: boolean;
      conversation: Conversation;
      messages: Message[];
    }>(`/conversations/${id}`);
    return { conversation: data.conversation, messages: data.messages };
  },

  rename: async (id: string, title: string): Promise<Conversation> => {
    const { data } = await apiClient.put<{ success: boolean; conversation: Conversation }>(
      `/conversations/${id}`,
      { title }
    );
    return data.conversation;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },

  deleteAll: async (): Promise<void> => {
    await apiClient.delete('/conversations');
  },
};

export const memoryApi = {
  getAll: async (): Promise<string[]> => {
    const { data } = await apiClient.get<{ success: boolean; facts: string[] }>('/memory');
    return data.facts;
  },

  deleteFact: async (index: number): Promise<string[]> => {
    const { data } = await apiClient.delete<{ success: boolean; facts: string[] }>(
      `/memory/${index}`
    );
    return data.facts;
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/memory/clear');
  },
};
