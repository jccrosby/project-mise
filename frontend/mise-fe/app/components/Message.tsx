import { clsx } from 'clsx';
import { Bot, User } from 'lucide-react';
import { Badge } from './ui/Badge';
import { ConversationMessage } from '../types/index';

interface MessageProps {
  message: ConversationMessage;
  isStreaming?: boolean;
}

export function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx('flex gap-4 p-4', {
        'flex-row-reverse': isUser,
      })}
    >
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          {
            'bg-primary-600 text-white': !isUser,
            'bg-blue-600 text-white': isUser,
          }
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={clsx('flex-1 max-w-3xl', {
          'text-right': isUser,
        })}
      >
        <div
          className={clsx('rounded-lg px-4 py-3 shadow-sm', {
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700':
              !isUser,
            'bg-blue-600 text-white': isUser,
          })}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{message.timestamp.toLocaleTimeString()}</span>
              {message.model && (
                <Badge variant="secondary">{message.model}</Badge>
              )}
              {message.domain && (
                <Badge variant="primary">{message.domain}</Badge>
              )}
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans">
              {message.content}
              {isStreaming && <span className="animate-pulse">▊</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
