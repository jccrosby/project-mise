import { ChatInput } from '../components/ChatInput';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ContextSelector } from '../components/ContextSelector';
import { Message } from '../components/Message';
import { useChat } from '../hooks/useChat';
import { useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:3001';
const DEFAULT_CONTEXTS = ['default', 'coding', 'mlb', 'cooking', 'fitness'];

export default function Chat() {
  const {
    conversations,
    currentContext,
    setCurrentContext,
    isStreaming,
    connectionStatus,
    sendMessage,
  } = useChat(WS_URL);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, currentContext]);

  const currentMessages = conversations.get(currentContext) || [];

  const handleSendMessage = (message: string) => {
    sendMessage(message, currentContext);
  };

  const handleContextChange = (context: string) => {
    setCurrentContext(context);
  };

  const handleCustomContext = (context: string) => {
    setCurrentContext(context);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          AI Router
        </h1>
        <ConnectionStatus status={connectionStatus} />
      </header>

      {/* Context Selector */}
      <ContextSelector
        contexts={DEFAULT_CONTEXTS}
        currentContext={currentContext}
        onContextChange={handleContextChange}
        onCustomContext={handleCustomContext}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to AI Router
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your local LLM interface with smart routing and context
                management. Start a conversation to see the magic happen!
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-primary-600 dark:text-primary-400">
                    Llama 3.2
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fast responses
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-primary-600 dark:text-primary-400">
                    Mistral
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complex reasoning
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-primary-600 dark:text-primary-400">
                    CodeLlama
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Programming help
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {currentMessages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                isStreaming={
                  isStreaming &&
                  index === currentMessages.length - 1 &&
                  message.role === 'assistant'
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={connectionStatus !== 'connected' || isStreaming}
        placeholder={
          connectionStatus !== 'connected'
            ? 'Connecting to AI Router...'
            : isStreaming
            ? 'AI is responding...'
            : "Ask me anything... I'll route to the best model!"
        }
      />
    </div>
  );
}
