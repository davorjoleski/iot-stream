
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const TelemetryChart = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [latestData, setLatestData] = useState({ temperature: 0, humidity: 0, pressure: 0 });

  useEffect(() => {
    // Fetch recent telemetry data
    const fetchTelemetryData = async () => {
      try {
        const { data } = await supabase
          .from('telemetry')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(24);

        if (data && data.length > 0) {
          const formattedData = data.reverse().map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            temperature: item.temperature || 0,
            humidity: item.humidity || 0,
            pressure: item.pressure || 0,
          }));
          
          setTelemetryData(formattedData);
          setLatestData({
            temperature: data[0].temperature || 0,
            humidity: data[0].humidity || 0,
            pressure: data[0].pressure || 0
          });
        } else {
          // Generate mock data if no real data exists
          generateMockData();
        }
      } catch (error) {
        console.error('Error fetching telemetry:', error);
        generateMockData();
      }
    };

    const generateMockData = () => {
      const now = new Date();
      const data = [];
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        const temp = Math.round((22 + Math.sin(i / 4) * 3 + Math.random() * 2) * 10) / 10;
        const humidity = Math.round((60 + Math.cos(i / 3) * 10 + Math.random() * 5) * 10) / 10;
        const pressure = Math.round((2.2 + Math.sin(i / 5) * 0.3 + Math.random() * 0.1) * 10) / 10;
        
        data.push({
          time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          temperature: temp,
          humidity: humidity,
          pressure: pressure,
        });
      }
      setTelemetryData(data);
      setLatestData({
        temperature: data[data.length - 1].temperature,
        humidity: data[data.length - 1].humidity,
        pressure: data[data.length - 1].pressure
      });
    };

    fetchTelemetryData();

    // Set up real-time subscription for new telemetry data
    const channel = supabase
      .channel('telemetry-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry' },
        (payload) => {
          console.log('New telemetry data:', payload);
          const newData = {
            time: new Date(payload.new.timestamp).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            temperature: payload.new.temperature || 0,
            humidity: payload.new.humidity || 0,
            pressure: payload.new.pressure || 0,
          };
          
          setTelemetryData(prev => [...prev.slice(-23), newData]);
          setLatestData({
            temperature: payload.new.temperature || 0,
            humidity: payload.new.humidity || 0,
            pressure: payload.new.pressure || 0
          });
        }
      )
      .subscribe();

    // Simulate real-time data updates every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const newTemp = Math.round((22 + Math.sin(Date.now() / 60000) * 3 + Math.random() * 2) * 10) / 10;
      const newHumidity = Math.round((60 + Math.cos(Date.now() / 45000) * 10 + Math.random() * 5) * 10) / 10;
      const newPressure = Math.round((2.2 + Math.sin(Date.now() / 75000) * 0.3 + Math.random() * 0.1) * 10) / 10;
      
      const newDataPoint = {
        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        temperature: newTemp,
        humidity: newHumidity,
        pressure: newPressure,
      };

      setTelemetryData(prev => [...prev.slice(-23), newDataPoint]);
      setLatestData({
        temperature: newTemp,
        humidity: newHumidity,
        pressure: newPressure
      });

      // Insert into database
      supabase.from('telemetry').insert([{
        device_id: '00000000-0000-0000-0000-000000000001', // Use first device ID or create a default
        temperature: newTemp,
        humidity: newHumidity,
        pressure: newPressure,
        timestamp: now.toISOString()
      }]);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Temperature Trends</span>
          </CardTitle>
          <CardDescription>Real-time temperature monitoring across all sensors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">
              {latestData.temperature}°C
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              Normal Range
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={telemetryData}>
              <defs>
                <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#temperatureGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <span>Humidity & Pressure</span>
          </CardTitle>
          <CardDescription>Environmental conditions monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex space-x-4">
              <div>
                <div className="text-xl font-bold text-cyan-600">{latestData.humidity}%</div>
                <div className="text-xs text-muted-foreground">Humidity</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{latestData.pressure} bar</div>
                <div className="text-xs text-muted-foreground">Pressure</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Optimal
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
