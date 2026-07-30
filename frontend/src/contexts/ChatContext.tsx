import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { streamChat } from '../api/chat';
import { conversationsApi } from '../api/conversations';
import type { Conversation, Message, ModelId, SSEEvent } from '../types';

interface ChatContextValue {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  selectedModel: ModelId;
  enableWebSearch: boolean;

  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
  sendMessage: (params: {
    message: string;
    file?: File;
  }) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  setSelectedModel: (m: ModelId) => void;
  setEnableWebSearch: (v: boolean) => void;
  abortStream: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('openrouter/free');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await conversationsApi.getAll();
      setConversations(convs);
    } catch {
      toast.error('Failed to load conversations');
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    try {
      const { conversation, messages: msgs } = await conversationsApi.getWithMessages(id);
      setActiveConversationId(id);
      setMessages(msgs);
      setSelectedModel(conversation.model as ModelId);
      setEnableWebSearch(conversation.enableWebSearch);
    } catch (err) {
      toast.error('Failed to load conversation');
      console.error('Failed to load conversation:', err);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await conversationsApi.delete(id);
        setConversations((prev) => prev.filter((c) => c._id !== id));
        if (activeConversationId === id) {
          startNewChat();
        }
      } catch (err) {
        toast.error('Failed to delete conversation');
        console.error('Failed to delete conversation:', err);
      }
    },
    [activeConversationId, startNewChat]
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      const updated = await conversationsApi.rename(id, title);
      setConversations((prev) => prev.map((c) => (c._id === id ? updated : c)));
      toast.success('Conversation renamed');
    } catch {
      toast.error('Failed to rename conversation');
    }
  }, []);

  const sendMessage = useCallback(
    async ({ message, file }: { message: string; file?: File }) => {
      if (isStreaming) return;

      // Optimistically add user message
      const userMsg: Message = {
        role: 'user',
        content: message || (file ? `📎 ${file.name}` : ''),
        attachments: file
          ? [{ type: file.type.startsWith('image/') ? 'image' : 'file', url: '', name: file.name }]
          : [],
        createdAt: new Date().toISOString(),
      };

      // Placeholder assistant message
      const assistantPlaceholder: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true,
        streamingState: null,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsStreaming(true);

      const abort = new AbortController();
      abortControllerRef.current = abort;

      let convId = activeConversationId;

      try {
        await streamChat(
          {
            message,
            conversationId: convId || undefined,
            model: selectedModel,
            enableWebSearch,
            file,
          },
          (event: SSEEvent) => {
            switch (event.type) {
              case 'conversation_id':
                convId = event.conversationId!;
                setActiveConversationId(convId);
                // Add to sidebar immediately
                setConversations((prev) => {
                  if (prev.some((c) => c._id === convId)) return prev;
                  return [
                    {
                      _id: convId!,
                      userId: '',
                      title: message.substring(0, 60) || 'New Chat',
                      model: selectedModel,
                      enableWebSearch,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                    ...prev,
                  ];
                });
                break;

              case 'content':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + (event.content || ''),
                    };
                  }
                  return updated;
                });
                break;

              case 'searching':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      streamingState: 'searching',
                      searchQuery: event.query,
                    };
                  }
                  return updated;
                });
                break;

              case 'search_results':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      streamingState: null,
                      searchResults: event.results,
                    };
                  }
                  return updated;
                });
                break;

              case 'generating_image':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      streamingState: 'generating_image',
                      imagePrompt: event.prompt,
                    };
                  }
                  return updated;
                });
                break;

              case 'image_generated':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      streamingState: null,
                      imageUrl: event.imageUrl,
                    };
                  }
                  return updated;
                });
                break;

              case 'done':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = { ...last, isStreaming: false };
                  }
                  return updated;
                });
                // Refresh conversation list to get updated timestamps
                loadConversations();
                break;

              case 'error':
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      isStreaming: false,
                      content: last.content || `Error: ${event.message}`,
                    };
                  }
                  return updated;
                });
                break;
            }
          },
          abort.signal
        );
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
              content: 'Sorry, something went wrong. Please try again.',
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, activeConversationId, selectedModel, enableWebSearch, loadConversations]
  );

  const abortStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.isStreaming) {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        isStreaming,
        selectedModel,
        enableWebSearch,
        loadConversations,
        selectConversation,
        startNewChat,
        sendMessage,
        deleteConversation,
        renameConversation,
        setSelectedModel,
        setEnableWebSearch,
        abortStream,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};
