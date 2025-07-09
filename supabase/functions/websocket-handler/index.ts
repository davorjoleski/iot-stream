
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface DeviceMessage {
  type: 'device_update' | 'telemetry' | 'alert' | 'command';
  deviceId: string;
  data: any;
  timestamp: string;
}

// Store connected clients
const clients = new Map<string, WebSocket>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const clientId = crypto.randomUUID();
  
  socket.onopen = () => {
    console.log(`WebSocket client ${clientId} connected`);
    clients.set(clientId, socket);
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to IoT WebSocket server',
      clientId: clientId
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'auth':
          // Handle authentication
          console.log('Client authenticated:', clientId);
          break;
          
        case 'device_command':
          // Handle device commands
          await handleDeviceCommand(message);
          break;
          
        case 'subscribe':
          // Handle subscription to specific device or data type
          console.log('Client subscribed:', message.topic);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket client ${clientId} disconnected`);
    clients.delete(clientId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(clientId);
  };

  return response;
});

async function handleDeviceCommand(message: any) {
  // Simulate device command processing
  console.log('Processing device command:', message);
  
  // Broadcast to all connected clients
  const response = {
    type: 'device_update',
    deviceId: message.deviceId,
    data: {
      command: message.command,
      status: 'executed',
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
  
  broadcastToClients(response);
}

function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((socket, clientId) => {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
      } else {
        clients.delete(clientId);
      }
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
}

// Simulate real-time data generation
setInterval(() => {
  const mockTelemetry = {
    type: 'telemetry',
    deviceId: Math.random() > 0.5 ? 'temp-sensor-01' : 'humidity-sensor-02',
    data: {
      temperature: Math.round((20 + Math.random() * 10) * 10) / 10,
      humidity: Math.round((40 + Math.random() * 30) * 10) / 10,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
  
  broadcastToClients(mockTelemetry);
}, 5000); // Send data every 5 seconds
