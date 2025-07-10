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
  const pingIntervalRef = useRef<number | null>(null);
  const maxReconnectAttempts = 3;
  const { toast } = useToast();

  const connect = () => {
    try {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const wsUrl = `wss://mrwanozupkjsdesqevzd.supabase.co/functions/v1/websocket-handler`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        onStatusChange?.(true);
        reconnectAttemptsRef.current = 0;
        
        // Send authentication message
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            timestamp: new Date().toISOString()
          }));
        }

        // Start ping/pong to keep connection alive
        startPingInterval();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);

          // Handle different message types
          switch (message.type) {
            case 'connection':
              console.log('Connection established:', message.data);
              break;
            case 'auth_success':
              console.log('Authentication successful');
              break;
            case 'pong':
              console.log('Pong received');
              break;
            case 'device_update':
            case 'telemetry':
              // Let parent component handle these
              break;
            case 'alert':
              toast({
                title: "New Alert",
                description: message.data.message,
                variant: message.data.severity === 'critical' ? 'destructive' : 'default',
              });
              break;
            case 'error':
              console.error('WebSocket server error:', message.data);
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
        stopPingInterval();
        
        // Only attempt to reconnect for unexpected closures
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current++;
          
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          toast({
            title: "Connection Lost",
            description: "WebSocket connection failed. Please refresh the page to reconnect.",
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

  const startPingInterval = () => {
    stopPingInterval();
    pingIntervalRef.current = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Ping every 30 seconds
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopPingInterval();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
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
