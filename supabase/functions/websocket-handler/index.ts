
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface DeviceMessage {
  type: 'device_update' | 'telemetry' | 'alert' | 'command' | 'auth';
  deviceId?: string;
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

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientId = crypto.randomUUID();
    
    socket.onopen = () => {
      console.log(`WebSocket client ${clientId} connected`);
      clients.set(clientId, socket);
      
      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connection',
        data: {
          message: 'Connected to IoT WebSocket server',
          clientId: clientId
        },
        timestamp: new Date().toISOString()
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        switch (message.type) {
          case 'auth':
            console.log('Client authenticated:', clientId);
            socket.send(JSON.stringify({
              type: 'auth_success',
              data: { clientId },
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'device_command':
            await handleDeviceCommand(message);
            break;
            
          case 'subscribe':
            console.log('Client subscribed:', message.topic);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to process message' },
          timestamp: new Date().toISOString()
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
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response("WebSocket upgrade failed", { status: 500 });
  }
});

async function handleDeviceCommand(message: any) {
  console.log('Processing device command:', message);
  
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

// Generate mock telemetry data
function generateMockTelemetry() {
  const deviceIds = ['temp-sensor-01', 'humidity-sensor-02', 'power-meter-03', 'pressure-sensor-04'];
  const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
  
  return {
    type: 'telemetry',
    deviceId: deviceId,
    data: {
      temperature: Math.round((18 + Math.random() * 15) * 10) / 10,
      humidity: Math.round((30 + Math.random() * 40) * 10) / 10,
      pressure: Math.round((990 + Math.random() * 40) * 10) / 10,
      power: Math.round((50 + Math.random() * 200) * 10) / 10,
      voltage: Math.round((220 + Math.random() * 20) * 10) / 10,
      current: Math.round((1 + Math.random() * 10) * 10) / 10,
      co2: Math.round((350 + Math.random() * 100)),
      light: Math.round((200 + Math.random() * 800)),
      noise: Math.round((30 + Math.random() * 50)),
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
}

// Send mock data every 2 seconds
setInterval(() => {
  if (clients.size > 0) {
    const mockTelemetry = generateMockTelemetry();
    broadcastToClients(mockTelemetry);
  }
}, 2000);

// Generate alerts periodically
setInterval(() => {
  if (clients.size > 0 && Math.random() < 0.1) { // 10% chance every 30 seconds
    const alertTypes = ['high_temperature', 'low_humidity', 'power_spike', 'device_offline'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const alert = {
      type: 'alert',
      data: {
        id: crypto.randomUUID(),
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        message: `Alert: ${alertTypes[Math.floor(Math.random() * alertTypes.length)].replace('_', ' ')} detected`,
        deviceId: 'sensor-' + Math.floor(Math.random() * 5),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    broadcastToClients(alert);
  }
}, 30000);
