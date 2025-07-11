
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeMessage {
  type: string;
  deviceId?: string;
  data: any;
  timestamp: string;
}

interface RealtimeManagerProps {
  onMessage?: (message: RealtimeMessage) => void;
  onStatusChange?: (connected: boolean) => void;
}

export const RealtimeManager = ({ onMessage, onStatusChange }: RealtimeManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setupRealtimeSubscriptions();
    
    return () => {
      cleanup();
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    try {
      // Subscribe to telemetry changes
      const telemetryChannel = supabase
        .channel('telemetry-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'telemetry' },
          (payload) => {
            console.log('New telemetry data:', payload);
            if (payload.new) {
              const message: RealtimeMessage = {
                type: 'telemetry',
                deviceId: payload.new.device_id,
                data: {
                  temperature: payload.new.temperature,
                  humidity: payload.new.humidity,
                  pressure: payload.new.pressure,
                  power: payload.new.power,
                  voltage: payload.new.voltage,
                  current: payload.new.current,
                  ...payload.new.data
                },
                timestamp: payload.new.timestamp
              };
              onMessage?.(message);
            }
          }
        )
        .subscribe((status) => {
          console.log('Telemetry subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            onStatusChange?.(true);
          }
        });

      // Subscribe to alerts
      const alertsChannel = supabase
        .channel('alerts-changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'alerts' },
          (payload) => {
            console.log('New alert:', payload);
            if (payload.new) {
              const message: RealtimeMessage = {
                type: 'alert',
                deviceId: payload.new.device_id,
                data: {
                  id: payload.new.id,
                  type: payload.new.type,
                  severity: payload.new.severity,
                  message: payload.new.message,
                  status: payload.new.status
                },
                timestamp: payload.new.created_at
              };
              onMessage?.(message);
              
              // Show toast notification
              toast({
                title: "New Alert",
                description: payload.new.message,
                variant: payload.new.severity === 'critical' ? 'destructive' : 'default',
              });
            }
          }
        )
        .subscribe();

      // Subscribe to device changes
      const devicesChannel = supabase
        .channel('devices-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'devices' },
          (payload) => {
            console.log('Device change:', payload);
            const deviceRecord = payload.new || payload.old;
            const deviceId = deviceRecord && typeof deviceRecord === 'object' && 'id' in deviceRecord ? deviceRecord.id as string : undefined;
            
            if (deviceRecord && deviceId) {
              const message: RealtimeMessage = {
                type: 'device_update',
                deviceId: deviceId,
                data: deviceRecord,
                timestamp: new Date().toISOString()
              };
              onMessage?.(message);
            }
          }
        )
        .subscribe();

      channelsRef.current = [telemetryChannel, alertsChannel, devicesChannel];

      // Start generating mock data for demonstration
      startMockDataGeneration();

    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      setIsConnected(false);
      onStatusChange?.(false);
    }
  };

  const startMockDataGeneration = async () => {
    // First, ensure we have some devices to work with
    const { data: existingDevices } = await supabase.from('devices').select('id').limit(4);
    
    let deviceIds: string[] = [];
    
    if (!existingDevices || existingDevices.length === 0) {
      // Create mock devices if none exist
      const mockDevices = [
        { name: 'Temperature Sensor 01', type: 'temperature', location: 'Server Room', status: 'online' },
        { name: 'Humidity Sensor 02', type: 'humidity', location: 'Warehouse', status: 'online' },
        { name: 'Power Meter 03', type: 'power', location: 'Main Panel', status: 'online' },
        { name: 'Pressure Sensor 04', type: 'pressure', location: 'Pipeline A', status: 'online' }
      ];
      
      const { data: newDevices, error: deviceError } = await supabase.from('devices').insert(mockDevices).select('id');
      if (deviceError) {
        console.error('Error creating mock devices:', deviceError);
        return;
      }
      deviceIds = newDevices?.map(d => d.id) || [];
    } else {
      deviceIds = existingDevices.map(d => d.id);
    }

    // Generate mock telemetry data every 3 seconds
    const interval = setInterval(async () => {
      try {
        if (deviceIds.length === 0) return;
        
        const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
        
        const mockTelemetry = {
          device_id: deviceId,
          temperature: Math.round((20 + Math.random() * 15) * 10) / 10,
          humidity: Math.round((35 + Math.random() * 30) * 10) / 10,
          pressure: Math.round((995 + Math.random() * 30) * 10) / 10,
          power: Math.round((80 + Math.random() * 150) * 10) / 10,
          voltage: Math.round((215 + Math.random() * 15) * 10) / 10,
          current: Math.round((1.5 + Math.random() * 8) * 10) / 10,
          data: {
            co2: Math.round((380 + Math.random() * 80)),
            light: Math.round((250 + Math.random() * 600)),
            noise: Math.round((35 + Math.random() * 40))
          }
        };

        const { error } = await supabase.from('telemetry').insert([mockTelemetry]);
        if (error) {
          console.error('Error inserting mock telemetry:', error);
        }
      } catch (error) {
        console.error('Error generating mock telemetry:', error);
      }
    }, 3000);

    // Generate occasional alerts
    const alertInterval = setInterval(async () => {
      if (Math.random() < 0.3 && deviceIds.length > 0) {
        try {
          const alertTypes = ['high_temperature', 'low_humidity', 'power_spike', 'device_offline'];
          const severities = ['low', 'medium', 'high', 'critical'];
          
          const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
          
          const { error } = await supabase.from('alerts').insert([{
            type: alertType,
            message: `Alert: ${alertType.replace('_', ' ')} detected`,
            severity: severity,
            device_id: deviceId,
            status: 'active'
          }]);
          
          if (error) {
            console.error('Error inserting mock alert:', error);
          }
        } catch (error) {
          console.error('Error generating mock alert:', error);
        }
      }
    }, 8000);

    // Store intervals for cleanup
    (window as any).mockDataIntervals = [interval, alertInterval];
  };

  const cleanup = () => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    
    // Clear mock data intervals
    if ((window as any).mockDataIntervals) {
      (window as any).mockDataIntervals.forEach((interval: number) => {
        clearInterval(interval);
      });
      delete (window as any).mockDataIntervals;
    }
    
    setIsConnected(false);
    onStatusChange?.(false);
  };

  return null;
};

export const useRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);

  const handleMessage = (message: RealtimeMessage) => {
    setLastMessage(message);
  };

  const handleStatusChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  return {
    isConnected,
    lastMessage,
    RealtimeComponent: () => (
      <RealtimeManager 
        onMessage={handleMessage} 
        onStatusChange={handleStatusChange} 
      />
    )
  };
};
