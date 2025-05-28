import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationMessage } from '../types/index';
import { useWebSocket } from './useWebSocket';

export function useChat(wsUrl: string) {
  const [conversations, setConversations] = useState<
    Map<string, ConversationMessage[]>
  >(new Map());
  const [currentContext, setCurrentContext] = useState('default');
  const [isStreaming, setIsStreaming] = useState(false);
  const currentMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');
  const processedMessagesRef = useRef<Set<any>>(new Set());
  const activeContextRef = useRef<string>('default'); // Add a new ref to track the current active context

  const {
    status,
    messages,
    sendMessage: wsSendMessage,
    clearMessages,
  } = useWebSocket({
    url: wsUrl,
  });

  const addMessage = useCallback(
    (contextId: string, cMessage: ConversationMessage) => {
      setConversations((prev) => {
        const newMap = new Map(prev);
        const msgs = newMap.get(contextId) || [];
        newMap.set(contextId, [...msgs, cMessage]);
        return newMap;
      });
    },
    []
  );

  const updateLastMessage = useCallback(
    (contextId: string, content: string) => {
      setConversations((prev) => {
        const newMap = new Map(prev);
        const messageMap = newMap.get(contextId) || [];
        if (messageMap.length > 0) {
          const updatedMessages = [...messageMap];
          const lastMessage = {
            ...updatedMessages[updatedMessages.length - 1],
          };
          lastMessage.content = content;
          updatedMessages[updatedMessages.length - 1] = lastMessage;
          newMap.set(contextId, updatedMessages);
        }
        return newMap;
      });
    },
    []
  );

  const sendMessage = useCallback(
    (query: string, contextId: string = currentContext, model?: string) => {
      if (!query.trim() || status !== 'connected') return false;

      // Set the active context for this conversation
      activeContextRef.current = contextId;

      // Add user message
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      addMessage(contextId, userMessage);

      // Prepare assistant message
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      addMessage(contextId, assistantMessage);
      currentMessageIdRef.current = assistantMessage.id;
      currentMessageRef.current = '';

      setIsStreaming(true);

      return wsSendMessage({
        query,
        contextId,
        stream: true,
        model,
      });
    },
    [currentContext, status, addMessage, wsSendMessage]
  );

  // Process WebSocket messages
  useEffect(() => {
    // Process each message in the batch
    const newMessages = messages.filter(
      (msg) => !processedMessagesRef.current.has(msg)
    );

    if (newMessages.length === 0) return;

    console.log(`*** Processing ${newMessages.length} new messages`, messages);

    newMessages.forEach((message) => {
      // Add to processed set to avoid reprocessing
      processedMessagesRef.current.add(message);

      // Process based on type
      switch (message.type) {
        case 'started': {
          setIsStreaming(true);
          break;
        }
        case 'chunk': {
          console.log(`*** Processing chunk:`, message);
          if (message.chunk) {
            // Use message.contextId if available, fallback to activeContextRef for the current stream
            const contextId = message.contextId || activeContextRef.current;
            currentMessageRef.current += message.chunk;
            console.log(
              `*** current message (${contextId}):`,
              currentMessageRef.current
            );
            updateLastMessage(contextId, currentMessageRef.current);
          }
          break;
        }
        case 'complete': {
          setIsStreaming(false);
          currentMessageRef.current = '';
          break;
        }
        case 'error': {
          setIsStreaming(false);
          // Add error message
          const errorMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${message.error}`,
            timestamp: new Date(),
          };
          // Use message.contextId if available, otherwise fall back to currentContext
          const contextId = message.contextId || currentContext;
          addMessage(contextId, errorMessage);
          break;
        }
      }
    });
  }, [messages, currentContext, updateLastMessage, addMessage]);

  return {
    conversations,
    currentContext,
    setCurrentContext,
    isStreaming,
    connectionStatus: status,
    sendMessage,
    clearMessages,
  };
}
