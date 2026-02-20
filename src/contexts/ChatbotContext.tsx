'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { ChatMessage } from '@/types/api';
import { apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

interface ChatbotContextType {
  isOpen: boolean;
  toggleChatbot: () => void;
  openChatbot: () => void;
  closeChatbot: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearHistory: () => void;
  isLoading: boolean;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your StockMind assistant. I can help you understand stocks, crypto, market trends, and navigate the platform. How can I assist you today?',
      timestamp: new Date(0).toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openChatbot = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChatbot = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call Gemini API
      const response = await apiPost<{ response: string; suggestions?: string[] }>(
        API_ENDPOINTS.gemini.chat,
        { message: content, context }
      );

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorDetail = error?.message || 'Unknown error';
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${errorDetail}. Please check your Gemini API key configuration.`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearHistory = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your StockMind assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const value = useMemo(() => ({
    isOpen,
    toggleChatbot,
    openChatbot,
    closeChatbot,
    messages,
    sendMessage,
    clearHistory,
    isLoading,
  }), [isOpen, toggleChatbot, openChatbot, closeChatbot, messages, sendMessage, clearHistory, isLoading]);

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
}

// Alias for consistency
export const useChatbotContext = useChatbot;
