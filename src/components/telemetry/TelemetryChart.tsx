
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp } from "lucide-react";

// Mock real-time data
const generateMockData = () => {
  const now = new Date();
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // Every minute
    data.push({
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      temperature: Math.round((22 + Math.sin(i / 4) * 3 + Math.random() * 2) * 10) / 10,
      humidity: Math.round((60 + Math.cos(i / 3) * 10 + Math.random() * 5) * 10) / 10,
      pressure: Math.round((2.2 + Math.sin(i / 5) * 0.3 + Math.random() * 0.1) * 10) / 10,
    });
  }
  return data;
};

export const TelemetryChart = () => {
  const data = generateMockData();
  const latestData = data[data.length - 1];

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
            <AreaChart data={data}>
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
            <LineChart data={data}>
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
