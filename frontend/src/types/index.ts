// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface Session {
  token: string;
  userAgent: string;
  ip: string;
  location: string;
  deviceType: string;
  lastActive: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  hasAcceptedTerms: boolean;
  isTwoFactorEnabled?: boolean;
  aiQuota?: number;
  quotaResetAt?: string;
}

export interface Memory {
  facts: string[];
  skills: Record<string, number>;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tempToken?: string | null; // For 2FA
  requires2FA?: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Conversations & Messages ─────────────────────────────────────────────────

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  model: ModelId;
  enableWebSearch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface Message {
  _id?: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  searchResults?: SearchResult[];
  imageUrl?: string;
  createdAt?: string;

  // Frontend-only streaming state
  isStreaming?: boolean;
  streamingState?: 'searching' | 'generating_image' | null;
  searchQuery?: string;
  imagePrompt?: string;
}

// ─── AI Models (OpenRouter) ──────────────────────────────────────────────────

export type ModelId = 
  | 'openrouter/free'
  | 'nvidia/nemotron-3-ultra-550b-a55b:free'
  | 'cohere/north-mini-code:free'
  | 'poolside/laguna-s-2.1:free';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  icon: string;
}

export const MODELS: ModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Auto',
    description: 'Auto-selects best available free model',
    icon: '🤖',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron Ultra',
    description: 'Massive scale reasoning model',
    icon: '🚀',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Code',
    description: 'Specialized for coding tasks',
    icon: '💻',
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside Laguna S',
    description: 'This model is best for developers with highskilled AI agents',
    icon: '🌊',
  },
];

// ─── Image Generation ─────────────────────────────────────────────────────────

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export interface ImageGenRequest {
  prompt: string;
  size: ImageSize;
}

// ─── SSE Stream Events ────────────────────────────────────────────────────────

export type SSEEventType =
  | 'conversation_id'
  | 'content'
  | 'searching'
  | 'search_results'
  | 'search_error'
  | 'generating_image'
  | 'image_generated'
  | 'image_error'
  | 'done'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  content?: string;
  conversationId?: string;
  query?: string;
  results?: SearchResult[];
  message?: string;
  imageUrl?: string;
  prompt?: string;
}
