import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Download } from "lucide-react";
import { ExportButton } from "@/components/export/ExportButton";
import { supabase } from "@/integrations/supabase/client";

interface TelemetryData {
  time: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  power?: number;
  voltage?: number;
  current?: number;
  co2?: number;
  light?: number;
  noise?: number;
  uptime?: number;
  efficiency?: number;
}

interface DeviceData {
  type: string;
  responseTime: number;
}

interface AlertData {
  time: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

const formatTime = (time: string) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTooltipTime = (time: string) => {
  const date = new Date(time);
  return date.toLocaleString();
};

export const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [alertData, setAlertData] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgTemperature: 0,
    avgHumidity: 0,
    totalAlerts: 0,
    activeDevices: 0,
  });

  const energyDistribution = [
    { name: 'HVAC', value: 400 },
    { name: 'Lighting', value: 300 },
    { name: 'Machinery', value: 300 },
    { name: 'Other', value: 200 },
  ];

  const deviceResponseData = [
    { type: 'Sensor', responseTime: 150 },
    { type: 'Actuator', responseTime: 220 },
    { type: 'Controller', responseTime: 180 },
  ];

  const alertFrequencyData = [
    { time: '00:00', critical: 10, high: 20, medium: 15, low: 30 },
    { time: '03:00', critical: 12, high: 18, medium: 20, low: 25 },
    { time: '06:00', critical: 8, high: 22, medium: 18, low: 28 },
    { time: '09:00', critical: 15, high: 15, medium: 22, low: 20 },
    { time: '12:00', critical: 11, high: 19, medium: 17, low: 26 },
    { time: '15:00', critical: 9, high: 21, medium: 19, low: 24 },
    { time: '18:00', critical: 13, high: 17, medium: 21, low: 22 },
    { time: '21:00', critical: 7, high: 23, medium: 16, low: 29 },
  ];

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTelemetryData(),
        fetchDeviceData(),
        fetchAlertData(),
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTelemetryData = async () => {
    try {
      const hoursBack = getTimeRangeHours();
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .gte('timestamp', startTime)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const processedData = data ? data.map(item => ({
        time: item.timestamp,
        temperature: item.temperature,
        humidity: item.humidity,
        pressure: item.pressure,
        power: item.power,
        voltage: item.voltage,
        current: item.current,
        co2: item.data?.co2,
        light: item.data?.light,
        noise: item.data?.noise,
        uptime: 95 + Math.random() * 5,
        efficiency: 70 + Math.random() * 30,
      })) : [];

      setTelemetryData(processedData);

      // Calculate average temperature and humidity
      if (processedData.length > 0) {
        const totalTemperature = processedData.reduce((sum, item) => sum + (item.temperature || 0), 0);
        const totalHumidity = processedData.reduce((sum, item) => sum + (item.humidity || 0), 0);
        const avgTemperature = totalTemperature / processedData.length || 0;
        const avgHumidity = totalHumidity / processedData.length || 0;

        setPerformanceMetrics(prev => ({
          ...prev,
          avgTemperature,
          avgHumidity,
        }));
      }
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
    }
  };

  const fetchDeviceData = async () => {
    try {
      // Fetch some mock device data
      setDeviceData([
        { type: 'Sensor', responseTime: 150 + Math.random() * 50 },
        { type: 'Actuator', responseTime: 220 + Math.random() * 80 },
        { type: 'Controller', responseTime: 180 + Math.random() * 60 },
      ]);
    } catch (error) {
      console.error('Error fetching device data:', error);
    }
  };

  const fetchAlertData = async () => {
    try {
      const hoursBack = getTimeRangeHours();
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process alert data to count severity levels over time
      const initialAlertData = {};
      const alertCounts = data ? data.reduce((acc, alert) => {
        const time = new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!acc[time]) {
          acc[time] = { time, critical: 0, high: 0, medium: 0, low: 0 };
        }
        acc[time][alert.severity] += 1;
        return acc;
      }, initialAlertData) : {};

      // Convert object to array
      const alertDataArray = Object.values(alertCounts) as AlertData[];
      setAlertData(alertDataArray);

      // Calculate total alerts
      const totalAlerts = data ? data.length : 0;
      const activeDevices = 50 + Math.floor(Math.random() * 20);

      setPerformanceMetrics(prev => ({
        ...prev,
        totalAlerts,
        activeDevices,
      }));
    } catch (error) {
      console.error('Error fetching alert data:', error);
    }
  };

  const getTimeRangeHours = () => {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground mt-1">Deep insights into your IoT ecosystem performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <ExportButton 
            data={{ 
              telemetry: telemetryData,
              devices: deviceData,
              alerts: alertData,
              analytics: performanceMetrics
            }}
            timeRange={`Last ${timeRange}`}
            filename="analytics-report"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Temperature</CardTitle>
            <CardDescription>Across all sensors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {performanceMetrics.avgTemperature.toFixed(1)}°C
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              <span>+3.5% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Humidity</CardTitle>
            <CardDescription>Across all sensors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {performanceMetrics.avgHumidity.toFixed(1)}%
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
              <span>-1.2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Alerts</CardTitle>
            <CardDescription>Generated in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {performanceMetrics.totalAlerts}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <BarChart3 className="w-4 h-4 mr-1 text-yellow-500" />
              <span>+8% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>Currently online</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {performanceMetrics.activeDevices}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              <span>+2% from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="alerts">Alert Analysis</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Telemetry Trends</CardTitle>
              <CardDescription>Historical telemetry data over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipTime} />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity" />
                    <Line type="monotone" dataKey="pressure" stroke="#10b981" name="Pressure" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Overall system efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={formatTime} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTooltipTime} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="efficiency" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Efficiency %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="uptime" 
                        stackId="2"
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="Uptime %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Response Times</CardTitle>
                <CardDescription>Average response time by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceResponseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                      <Bar dataKey="responseTime" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Power Consumption Trends</CardTitle>
                <CardDescription>Real-time power usage monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={formatTime} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTooltipTime} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="power" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={false}
                        name="Power (W)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="voltage" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={false}
                        name="Voltage (V)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy Distribution</CardTitle>
                <CardDescription>Power consumption by device category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={energyDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {energyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Conditions</CardTitle>
                <CardDescription>Temperature and humidity correlation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="temperature" name="Temperature" unit="°C" />
                      <YAxis dataKey="humidity" name="Humidity" unit="%" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Temp vs Humidity" data={telemetryData} fill="#06b6d4" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Air Quality Metrics</CardTitle>
                <CardDescription>CO2 levels and environmental factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={formatTime} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTooltipTime} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="co2" 
                        stroke="#84cc16" 
                        fill="#84cc16"
                        fillOpacity={0.4}
                        name="CO2 (ppm)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="light" 
                        stroke="#f97316" 
                        fill="#f97316"
                        fillOpacity={0.3}
                        name="Light (lux)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Frequency</CardTitle>
                <CardDescription>Alert patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertFrequencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={formatTime} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                      <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                      <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
                      <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Resolution Time</CardTitle>
                <CardDescription>Average time to resolve alerts by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertResolutionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} min`, 'Resolution Time']} />
                      <Bar dataKey="resolutionTime" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Variable Analysis</CardTitle>
              <CardDescription>Correlation between different sensor readings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={formatTime} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip labelFormatter={formatTooltipTime} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      name="Temperature (°C)"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Humidity (%)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="power" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                      name="Power (W)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="pressure" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      name="Pressure (hPa)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
