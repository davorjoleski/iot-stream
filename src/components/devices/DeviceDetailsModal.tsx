
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Droplets, Zap, Gauge, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  last_seen: string;
  telemetry_data: any;
  configuration: any;
}

interface DeviceDetailsModalProps {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeviceDetailsModal = ({ device, open, onOpenChange }: DeviceDetailsModalProps) => {
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [realtimeData, setRealtimeData] = useState(device.telemetry_data || {});

  useEffect(() => {
    if (!open || !device) return;

    // Fetch telemetry history
    const fetchTelemetryHistory = async () => {
      try {
        const { data } = await supabase
          .from('telemetry')
          .select('*')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (data) {
          const formattedData = data.reverse().map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            temperature: item.temperature,
            humidity: item.humidity,
            pressure: item.pressure,
            power: item.power,
            voltage: item.voltage,
            current: item.current,
          }));
          setTelemetryHistory(formattedData);
        }
      } catch (error) {
        console.error('Error fetching telemetry:', error);
      }
    };

    fetchTelemetryHistory();

    // Set up real-time subscription for this device
    const channel = supabase
      .channel(`device-${device.id}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'telemetry',
          filter: `device_id=eq.${device.id}`
        },
        (payload) => {
          console.log('New telemetry data:', payload);
          const newData = {
            time: new Date(payload.new.timestamp).toLocaleTimeString(),
            temperature: payload.new.temperature,
            humidity: payload.new.humidity,
            pressure: payload.new.pressure,
            power: payload.new.power,
            voltage: payload.new.voltage,
            current: payload.new.current,
          };
          
          setTelemetryHistory(prev => [...prev.slice(-49), newData]);
          setRealtimeData({
            temperature: payload.new.temperature,
            humidity: payload.new.humidity,
            pressure: payload.new.pressure,
            power: payload.new.power,
            voltage: payload.new.voltage,
            current: payload.new.current,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [device, open]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'power': return Zap;
      case 'pressure': return Gauge;
      default: return Activity;
    }
  };

  const formatValue = (key: string, value: number) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (key) {
      case 'temperature': return `${value}°C`;
      case 'humidity': return `${value}%`;
      case 'pressure': return `${value} bar`;
      case 'power': return `${value}W`;
      case 'voltage': return `${value}V`;
      case 'current': return `${value}A`;
      default: return `${value}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>{device.name}</span>
            <Badge className={getStatusColor(device.status)}>
              {device.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Type</span>
                </div>
                <p className="text-lg font-semibold mt-1">{device.type}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <p className="text-lg font-semibold mt-1">{device.location || 'Not set'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Last Seen</span>
                </div>
                <p className="text-lg font-semibold mt-1">
                  {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(realtimeData).map(([key, value]) => {
                  if (value === null || value === undefined) return null;
                  
                  const IconComponent = getMetricIcon(key);
                  return (
                    <div key={key} className="text-center p-4 bg-muted/50 rounded-lg">
                      <IconComponent className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="text-xl font-bold">{formatValue(key, value)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Telemetry Chart */}
          {telemetryHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    {realtimeData.temperature && (
                      <Line type="monotone" dataKey="temperature" stroke="#3B82F6" strokeWidth={2} />
                    )}
                    {realtimeData.humidity && (
                      <Line type="monotone" dataKey="humidity" stroke="#06B6D4" strokeWidth={2} />
                    )}
                    {realtimeData.pressure && (
                      <Line type="monotone" dataKey="pressure" stroke="#10B981" strokeWidth={2} />
                    )}
                    {realtimeData.power && (
                      <Line type="monotone" dataKey="power" stroke="#F59E0B" strokeWidth={2} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Configuration */}
          {device.configuration && Object.keys(device.configuration).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(device.configuration, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
