
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAppData = (user: any) => {
  const { toast } = useToast();
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    if (!user) return;

    fetchData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [user, toast]);

  const fetchData = async () => {
    try {
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setDevices(devicesData || []);
      setAlerts(alertsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const devicesChannel = supabase
      .channel('devices-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          console.log('Device change:', payload);
          fetchData();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('alerts-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('Alert change:', payload);
          fetchData();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Alert",
              description: payload.new.message,
              variant: payload.new.severity === 'critical' ? 'destructive' : 'default',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(alertsChannel);
    };
  };

  return {
    devices,
    alerts,
    selectedDevice,
    setSelectedDevice,
    fetchData
  };
};
