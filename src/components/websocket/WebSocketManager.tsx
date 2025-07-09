
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  deviceId?: string;
  data: any;
  timestamp: string;
}

interface WebSocketManagerProps {
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (connected: boolean) => void;
}

export const WebSocketManager = ({ onMessage, onStatusChange }: WebSocketManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  const connect = () => {
    try {
      // Use the correct WebSocket URL format for Supabase edge functions
      const wsUrl = `wss://mrwanozupkjsdesqevzd.supabase.co/functions/v1/websocket-handler`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        onStatusChange?.(true);
        
        // Send authentication message
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            timestamp: new Date().toISOString()
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);

          // Handle different message types
          switch (message.type) {
            case 'device_update':
              break;
            case 'alert':
              toast({
                title: "New Alert",
                description: message.data.message,
                variant: message.data.severity === 'critical' ? 'destructive' : 'default',
              });
              break;
            case 'telemetry':
              break;
            case 'connection':
              console.log('Connection established:', message.data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        onStatusChange?.(false);
        
        // Only attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        onStatusChange?.(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return null;
};

// Hook for using WebSocket in components
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const handleMessage = (message: WebSocketMessage) => {
    setLastMessage(message);
  };

  const handleStatusChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  return {
    isConnected,
    lastMessage,
    WebSocketComponent: () => (
      <WebSocketManager 
        onMessage={handleMessage} 
        onStatusChange={handleStatusChange} 
      />
    )
  };
};
