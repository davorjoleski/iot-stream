
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { RefreshCw, Zap, ZoomIn } from "lucide-react";
import { ExportButton } from "@/components/export/ExportButton";
import { useWebSocket } from "@/components/websocket/WebSocketManager";
import { supabase } from "@/integrations/supabase/client";

interface TelemetryData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  power?: number;
  voltage?: number;
  current?: number;
  co2?: number;
  light?: number;
  noise?: number;
}

export const TelemetryChart = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature', 'humidity', 'power']);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { isConnected, lastMessage } = useWebSocket();

  // Available metrics configuration
  const metricsConfig = {
    temperature: { color: '#ef4444', unit: '°C', label: 'Temperature' },
    humidity: { color: '#3b82f6', unit: '%', label: 'Humidity' },
    pressure: { color: '#10b981', unit: 'hPa', label: 'Pressure' },
    power: { color: '#f59e0b', unit: 'W', label: 'Power' },
    voltage: { color: '#8b5cf6', unit: 'V', label: 'Voltage' },
    current: { color: '#ec4899', unit: 'A', label: 'Current' },
    co2: { color: '#84cc16', unit: 'ppm', label: 'CO2' },
    light: { color: '#f97316', unit: 'lux', label: 'Light' },
    noise: { color: '#06b6d4', unit: 'dB', label: 'Noise' }
  };

  useEffect(() => {
    fetchTelemetryData();
    const interval = setInterval(fetchTelemetryData, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [timeRange]);

  // Handle real-time WebSocket data
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'telemetry') {
      const newData = {
        timestamp: lastMessage.timestamp,
        ...lastMessage.data
      };
      
      setTelemetryData(prev => {
        const updated = [newData, ...prev].slice(0, getMaxDataPoints());
        return updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });
      setLastUpdate(new Date());
    }
  }, [lastMessage]);

  const getTimeRangeHours = () => {
    switch (timeRange) {
      case '15m': return 0.25;
      case '30m': return 0.5;
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      default: return 1;
    }
  };

  const getMaxDataPoints = () => {
    switch (timeRange) {
      case '15m': return 450; // 15min * 30 points/min
      case '30m': return 900; // 30min * 30 points/min
      case '1h': return 1800; // 1h * 30 points/min
      case '6h': return 1080; // 6h * 3 points/min
      case '24h': return 1440; // 24h * 1 point/min
      case '7d': return 2016; // 7d * 12 points/hour
      default: return 1800;
    }
  };

  const fetchTelemetryData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const hoursBack = getTimeRangeHours();
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .gte('timestamp', startTime)
        .order('timestamp', { ascending: true })
        .limit(getMaxDataPoints());

      if (error) throw error;

      // Generate some mock data if no real data exists
      if (!data || data.length === 0) {
        const mockData = generateMockTelemetryData(hoursBack);
        setTelemetryData(mockData);
      } else {
        setTelemetryData(data.map(item => ({
          timestamp: item.timestamp,
          temperature: item.temperature,
          humidity: item.humidity,
          pressure: item.pressure,
          power: item.power,
          voltage: item.voltage,
          current: item.current,
          co2: item.data?.co2,
          light: item.data?.light,
          noise: item.data?.noise,
        })));
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTelemetryData = (hours: number): TelemetryData[] => {
    const data: TelemetryData[] = [];
    const points = Math.min(getMaxDataPoints(), hours * 60); // One point per minute for recent data
    const interval = (hours * 60 * 60 * 1000) / points;

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(Date.now() - (points - i - 1) * interval);
      data.push({
        timestamp: timestamp.toISOString(),
        temperature: 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
        humidity: 45 + Math.cos(i * 0.08) * 15 + Math.random() * 5,
        pressure: 1010 + Math.sin(i * 0.05) * 20 + Math.random() * 5,
        power: 100 + Math.sin(i * 0.12) * 30 + Math.random() * 10,
        voltage: 220 + Math.sin(i * 0.03) * 10 + Math.random() * 2,
        current: 2 + Math.sin(i * 0.15) * 1 + Math.random() * 0.5,
        co2: 400 + Math.sin(i * 0.07) * 50 + Math.random() * 20,
        light: 300 + Math.sin(i * 0.2) * 200 + Math.random() * 50,
        noise: 40 + Math.sin(i * 0.18) * 10 + Math.random() * 5,
      });
    }

    return data;
  };

  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value !== 'number') return [value, name];
    const config = metricsConfig[name as keyof typeof metricsConfig];
    return [
      `${value.toFixed(1)}${config?.unit || ''}`,
      config?.label || name
    ];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else if (diffHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Real-time Telemetry</h2>
          <p className="text-muted-foreground">
            Live sensor data with {isConnected ? 'real-time' : 'periodic'} updates
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            <Zap className="w-3 h-3 mr-1" />
            {isConnected ? "Live" : "Offline"}
          </Badge>
          <ExportButton 
            data={{ telemetry: telemetryData }}
            timeRange={`Last ${timeRange}`}
            filename="telemetry-data"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Sensor Readings</CardTitle>
              <CardDescription>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Last 15m</SelectItem>
                  <SelectItem value="30m">Last 30m</SelectItem>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTelemetryData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(metricsConfig).map(([key, config]) => (
                <Badge
                  key={key}
                  variant={selectedMetrics.includes(key) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedMetrics(prev => 
                      prev.includes(key) 
                        ? prev.filter(m => m !== key)
                        : [...prev, key]
                    );
                  }}
                  style={selectedMetrics.includes(key) ? { backgroundColor: config.color } : {}}
                >
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${formatTimestamp(label)}`}
                  formatter={formatTooltipValue}
                />
                <Legend />
                
                {selectedMetrics.map(metric => {
                  const config = metricsConfig[metric as keyof typeof metricsConfig];
                  return (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={config.color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      name={config.label}
                    />
                  );
                })}
                
                {/* Add brush for zooming */}
                <Brush
                  dataKey="timestamp"
                  height={30}
                  tickFormatter={formatTimestamp}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Data points: {telemetryData.length}</span>
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              <span>Drag on bottom chart to zoom</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
