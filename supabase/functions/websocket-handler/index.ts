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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol",
      },
    });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
    
    const clientId = crypto.randomUUID();
    
    socket.onopen = () => {
      console.log(`WebSocket client ${clientId} connected`);
      clients.set(clientId, socket);
      
      socket.send(JSON.stringify({
        type: 'connection',
        data: {
          message: 'Connected to IoT WebSocket server',
          clientId: clientId,
          status: 'online'
        },
        timestamp: new Date().toISOString()
      }));

      startMockDataGeneration(clientId);
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
              data: { clientId, status: 'authenticated' },
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
    return new Response("WebSocket upgrade failed", { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
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

function startMockDataGeneration(clientId: string) {
  const telemetryInterval = setInterval(() => {
    const socket = clients.get(clientId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      clearInterval(telemetryInterval);
      return;
    }

    const mockTelemetry = generateMockTelemetry();
    socket.send(JSON.stringify(mockTelemetry));
    saveTelemetryToDatabase(mockTelemetry);
  }, 2000);

  const alertInterval = setInterval(() => {
    const socket = clients.get(clientId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      clearInterval(alertInterval);
      return;
    }

    if (Math.random() < 0.15) {
      const alert = generateMockAlert();
      socket.send(JSON.stringify(alert));
      saveAlertToDatabase(alert);
    }
  }, 10000);
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
