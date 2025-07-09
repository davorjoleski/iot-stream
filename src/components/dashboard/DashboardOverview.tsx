
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Shield, 
  TrendingUp, 
  Wifi,
  WifiOff,
  Clock,
  Users,
  Settings,
  Download,
  RefreshCw
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface DashboardOverviewProps {
  devices: any[];
  alerts: any[];
}

export const DashboardOverview = ({ devices, alerts }: DashboardOverviewProps) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [telemetryData, setTelemetryData] = useState([]);
  const [deviceStatusData, setDeviceStatusData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);
  const [powerData, setPowerData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate statistics
  const activeDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const warningDevices = devices.filter(d => d.status === 'warning').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const uptime = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      // Get time range for queries
      const now = new Date();
      const timeRangeHours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

      // Fetch telemetry data
      const { data: telemetry } = await supabase
        .from('telemetry')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true })
        .limit(100);

      if (telemetry) {
        // Process telemetry data for charts
        const processedData = telemetry.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          temperature: item.temperature || 0,
          humidity: item.humidity || 0,
          pressure: item.pressure || 0,
          power: item.power || 0,
          voltage: item.voltage || 0,
          current: item.current || 0,
        }));
        setTelemetryData(processedData);

        // Extract power data for separate chart
        const powerChartData = processedData.filter(item => item.power > 0);
        setPowerData(powerChartData);
      }

      // Process device status for pie chart
      const statusData = [
        { name: 'Online', value: activeDevices, color: '#10B981' },
        { name: 'Offline', value: offlineDevices, color: '#EF4444' },
        { name: 'Warning', value: warningDevices, color: '#F59E0B' }
      ].filter(item => item.value > 0);
      setDeviceStatusData(statusData);

      // Process alerts data
      const { data: alertHistory } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      if (alertHistory) {
        const alertsChartData = alertHistory.reduce((acc: any[], alert) => {
          const date = new Date(alert.created_at).toLocaleDateString();
          const existing = acc.find(item => item.date === date);
          if (existing) {
            existing[alert.severity] = (existing[alert.severity] || 0) + 1;
            existing.total += 1;
          } else {
            acc.push({
              date,
              [alert.severity]: 1,
              total: 1
            });
          }
          return acc;
        }, []);
        setAlertsData(alertsChartData);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    // Implementation for data export
    console.log(`Exporting data as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">IoT Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalyticsData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{activeDevices}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-600">{offlineDevices}</p>
              </div>
              <WifiOff className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningDevices}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-purple-600">{criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-blue-600">{uptime}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-indigo-600">{totalDevices}</p>
              </div>
              <Database className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Environmental Sensors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="temperature" stroke="#3B82F6" fillOpacity={1} fill="url(#tempGradient)" />
                <Area type="monotone" dataKey="humidity" stroke="#06B6D4" fillOpacity={1} fill="url(#humidityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Power Consumption Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Power Consumption</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={powerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="power" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="voltage" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="current" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alertsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="critical" stackId="a" fill="#EF4444" />
                <Bar dataKey="high" stackId="a" fill="#F59E0B" />
                <Bar dataKey="medium" stackId="a" fill="#3B82F6" />
                <Bar dataKey="low" stackId="a" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Avg Response Time</p>
                <p className="text-lg font-bold">120ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Data Points Today</p>
                <p className="text-lg font-bold">15.2k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Active Users</p>
                <p className="text-lg font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Automated Tasks</p>
                <p className="text-lg font-bold">8 Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
