
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

interface DeviceMessage {
  type: 'device_update' | 'telemetry' | 'alert' | 'command' | 'auth';
  deviceId?: string;
  data: any;
  timestamp: string;
}

const clients = new Map<string, WebSocket>();

const supabase = createClient(
  'https://mrwanozupkjsdesqevzd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yd2Fub3p1cGtqc2Rlc3FldnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODY2NzcsImV4cCI6MjA2NzU2MjY3N30.8aromJx-G8NA5IZwmcVNyGFauowaLjQFCyXY9dXZ0iQ'
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol, sec-websocket-extensions',
};

serve(async (req) => {
  console.log('WebSocket handler received request:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const upgradeHeader = req.headers.get("upgrade");
  const connectionHeader = req.headers.get("connection");
  
  console.log('Headers:', {
    upgrade: upgradeHeader,
    connection: connectionHeader,
    origin: req.headers.get("origin"),
  });

  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket upgrade request');
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    console.log('Attempting WebSocket upgrade...');
    
    const { socket, response } = Deno.upgradeWebSocket(req, {
      headers: corsHeaders
    });
    
    const clientId = crypto.randomUUID();
    console.log(`WebSocket upgrade successful for client ${clientId}`);
    
    socket.onopen = () => {
      console.log(`WebSocket client ${clientId} connected successfully`);
      clients.set(clientId, socket);
      
      // Send connection confirmation
      socket.send(JSON.stringify({
        type: 'connection',
        data: {
          message: 'Connected to IoT WebSocket server',
          clientId: clientId,
          status: 'connected',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }));

      // Start sending mock data
      startMockDataGeneration(clientId);
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`Message from client ${clientId}:`, message);

        switch (message.type) {
          case 'auth':
            console.log(`Client ${clientId} authenticated`);
            socket.send(JSON.stringify({
              type: 'auth_success',
              data: { 
                clientId, 
                status: 'authenticated',
                message: 'Authentication successful'
              },
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'device_command':
            await handleDeviceCommand(message, clientId);
            break;
            
          case 'subscribe':
            console.log(`Client ${clientId} subscribed to:`, message.topic);
            break;
            
          case 'ping':
            socket.send(JSON.stringify({
              type: 'pong',
              data: { timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            console.log(`Unknown message type from client ${clientId}:`, message.type);
        }
      } catch (error) {
        console.error(`Error processing message from client ${clientId}:`, error);
        socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to process message', error: error.message },
          timestamp: new Date().toISOString()
        }));
      }
    };

    socket.onclose = (event) => {
      console.log(`WebSocket client ${clientId} disconnected:`, event.code, event.reason);
      clients.delete(clientId);
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    };

    return response;
    
  } catch (error) {
    console.error('WebSocket upgrade failed:', error);
    return new Response(`WebSocket upgrade failed: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});

async function handleDeviceCommand(message: any, clientId: string) {
  console.log(`Processing device command from client ${clientId}:`, message);
  
  try {
    const response = {
      type: 'device_update',
      deviceId: message.deviceId,
      data: {
        command: message.command,
        status: 'executed',
        executedAt: new Date().toISOString(),
        clientId: clientId
      },
      timestamp: new Date().toISOString()
    };
    
    broadcastToClients(response);
  } catch (error) {
    console.error('Error handling device command:', error);
  }
}

function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  let activeClients = 0;
  
  clients.forEach((socket, clientId) => {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
        activeClients++;
      } else {
        console.log(`Removing inactive client ${clientId}`);
        clients.delete(clientId);
      }
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
  
  console.log(`Broadcasted message to ${activeClients} active clients`);
}

function startMockDataGeneration(clientId: string) {
  console.log(`Starting mock data generation for client ${clientId}`);
  
  // Send initial telemetry immediately
  setTimeout(() => {
    const socket = clients.get(clientId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      const initialTelemetry = generateMockTelemetry();
      socket.send(JSON.stringify(initialTelemetry));
      console.log(`Sent initial telemetry to client ${clientId}`);
    }
  }, 1000);

  // Regular telemetry updates
  const telemetryInterval = setInterval(() => {
    const socket = clients.get(clientId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log(`Stopping telemetry for disconnected client ${clientId}`);
      clearInterval(telemetryInterval);
      return;
    }

    try {
      const mockTelemetry = generateMockTelemetry();
      socket.send(JSON.stringify(mockTelemetry));
      saveTelemetryToDatabase(mockTelemetry);
    } catch (error) {
      console.error(`Error sending telemetry to client ${clientId}:`, error);
      clearInterval(telemetryInterval);
    }
  }, 3000);

  // Occasional alerts
  const alertInterval = setInterval(() => {
    const socket = clients.get(clientId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log(`Stopping alerts for disconnected client ${clientId}`);
      clearInterval(alertInterval);
      return;
    }

    if (Math.random() < 0.2) {
      try {
        const alert = generateMockAlert();
        socket.send(JSON.stringify(alert));
        saveAlertToDatabase(alert);
        console.log(`Sent alert to client ${clientId}`);
      } catch (error) {
        console.error(`Error sending alert to client ${clientId}:`, error);
      }
    }
  }, 8000);
}

function generateMockTelemetry() {
  const deviceIds = ['temp-sensor-01', 'humidity-sensor-02', 'power-meter-03', 'pressure-sensor-04'];
  const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
  
  const baseTime = new Date();
  const temperature = Math.round((20 + Math.random() * 15) * 10) / 10;
  const humidity = Math.round((35 + Math.random() * 30) * 10) / 10;
  const pressure = Math.round((995 + Math.random() * 30) * 10) / 10;
  const power = Math.round((80 + Math.random() * 150) * 10) / 10;
  const voltage = Math.round((215 + Math.random() * 15) * 10) / 10;
  const current = Math.round((1.5 + Math.random() * 8) * 10) / 10;

  return {
    type: 'telemetry',
    deviceId: deviceId,
    data: {
      temperature,
      humidity,
      pressure,
      power,
      voltage,
      current,
      co2: Math.round((380 + Math.random() * 80)),
      light: Math.round((250 + Math.random() * 600)),
      noise: Math.round((35 + Math.random() * 40)),
      timestamp: baseTime.toISOString()
    },
    timestamp: baseTime.toISOString()
  };
}

function generateMockAlert() {
  const alertTypes = ['high_temperature', 'low_humidity', 'power_spike', 'device_offline', 'pressure_anomaly'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const deviceIds = ['temp-sensor-01', 'humidity-sensor-02', 'power-meter-03', 'pressure-sensor-04'];
  
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
  
  return {
    type: 'alert',
    data: {
      id: crypto.randomUUID(),
      type: alertType,
      severity: severity,
      message: `Alert: ${alertType.replace('_', ' ')} detected on ${deviceId}`,
      deviceId: deviceId,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
}

async function saveTelemetryToDatabase(telemetryData: any) {
  try {
    const { error } = await supabase
      .from('telemetry')
      .insert([{
        device_id: telemetryData.deviceId,
        temperature: telemetryData.data.temperature,
        humidity: telemetryData.data.humidity,
        pressure: telemetryData.data.pressure,
        power: telemetryData.data.power,
        voltage: telemetryData.data.voltage,
        current: telemetryData.data.current,
        data: {
          co2: telemetryData.data.co2,
          light: telemetryData.data.light,
          noise: telemetryData.data.noise
        },
        timestamp: telemetryData.timestamp
      }]);

    if (error) {
      console.error('Error saving telemetry:', error);
    }
  } catch (error) {
    console.error('Error saving telemetry to database:', error);
  }
}

async function saveAlertToDatabase(alertData: any) {
  try {
    const { error } = await supabase
      .from('alerts')
      .insert([{
        type: alertData.data.type,
        message: alertData.data.message,
        severity: alertData.data.severity,
        device_id: alertData.data.deviceId,
        status: 'active'
      }]);

    if (error) {
      console.error('Error saving alert:', error);
    }
  } catch (error) {
    console.error('Error saving alert to database:', error);
  }
}
