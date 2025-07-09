
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  deviceId: string;
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
      // Create WebSocket connection to our edge function
      const wsUrl = `wss://mrwanozupkjsdesqevzd.supabase.co/functions/v1/websocket-handler`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        onStatusChange?.(true);
        
        // Send authentication message
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          token: supabase.auth.getSession()
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);

          // Handle different message types
          switch (message.type) {
            case 'device_update':
              // Device status or data update
              break;
            case 'alert':
              toast({
                title: "New Alert",
                description: message.data.message,
                variant: message.data.severity === 'critical' ? 'destructive' : 'default',
              });
              break;
            case 'telemetry':
              // Real-time telemetry data
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onStatusChange?.(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
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
    wsRef.current?.close();
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

  return null; // This is a utility component that doesn't render anything
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
