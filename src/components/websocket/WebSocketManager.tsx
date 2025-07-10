
import { useEffect, useRef, useState } from 'react';
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
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const { toast } = useToast();

  const connect = () => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = `wss://mrwanozupkjsdesqevzd.supabase.co/functions/v1/websocket-handler`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        onStatusChange?.(true);
        reconnectAttemptsRef.current = 0;
        
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
            case 'auth_success':
              console.log('Authentication successful');
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
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log(`Attempting to reconnect... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          toast({
            title: "Connection Lost",
            description: "WebSocket connection failed. Using fallback data mode.",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        onStatusChange?.(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
      onStatusChange?.(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
    setIsConnected(false);
    onStatusChange?.(false);
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return null;
};

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
