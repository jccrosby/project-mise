import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatRequest, ChatResponse, ConnectionStatus } from '../types/index';

interface UseWebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  batchInterval?: number;
  batchSize?: number;
}

export function useWebSocket({
  url,
  reconnectAttempts = 5,
  reconnectInterval = 2000,
  batchInterval = 1000, // Time in ms to batch messages
  batchSize = 300, // Max number of messages to batch before forcing an update
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageBufferRef = useRef<ChatResponse[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log(`*** Messages (${status})`, messages);

  // Function to flush the message buffer to state
  const flushMessageBuffer = useCallback(() => {
    if (messageBufferRef.current.length > 0) {
      console.log(`*** Flushing ${messageBufferRef.current.length} messages`);
      console.log(
        `*** Previous messages count: ${messages.length}, New messages count: ${messageBufferRef.current.length}`
      );
      setMessages([...messages, ...messageBufferRef.current]);
      messageBufferRef.current = [];
    }
    batchTimeoutRef.current = null;
  }, []);

  // Function to add a message to the buffer and schedule a flush
  const bufferMessage = useCallback(
    (message: ChatResponse) => {
      messageBufferRef.current.push(message);
      // Flush immediately if we reach the batch size
      if (messageBufferRef.current.length >= batchSize) {
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        flushMessageBuffer();
      }
      // Otherwise schedule a flush
      else if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(flushMessageBuffer, batchInterval);
      }
    },
    [batchSize, batchInterval, flushMessageBuffer]
  );

  const connect = useCallback(() => {
    try {
      setStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data: ChatResponse = JSON.parse(event.data);
          bufferMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        console.log('WebSocket disconnected');

        // Flush any remaining messages
        flushMessageBuffer();

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectCountRef.current}`);
            connect();
          }, reconnectInterval * reconnectCountRef.current);
        }
      };

      ws.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      console.error('Failed to connect WebSocket:', error);
    }
  }, [
    url,
    reconnectAttempts,
    reconnectInterval,
    bufferMessage,
    flushMessageBuffer,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      flushMessageBuffer(); // Flush any remaining messages
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, [flushMessageBuffer]);

  const sendMessage = useCallback((request: ChatRequest) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(request));
      return true;
    }
    return false;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageBufferRef.current = [];
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    messages,
    sendMessage,
    clearMessages,
    connect,
    disconnect,
  };
}
