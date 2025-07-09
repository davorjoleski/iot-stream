import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardOverviewProps {
  devices: any[];
  alerts: any[];
}

export const DashboardOverview = ({ devices, alerts }: DashboardOverviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('1h');
  const [telemetryData, setTelemetryData] = useState([]);
  const [deviceStatusData, setDeviceStatusData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);
  const [powerData, setPowerData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [activeUsers, setActiveUsers] = useState(1);
  const [zoomDomain, setZoomDomain] = useState(null);

  const activeDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const warningDevices = devices.filter(d => d.status === 'warning').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const uptime = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

  const generateRealTimeData = useCallback(() => {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const intervalMs = timeRange === '1h' ? 60000 : timeRange === '24h' ? 3600000 : timeRange === '7d' ? 86400000 : 86400000;
    
    const data = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      const baseTemp = 22 + Math.sin(i / 10) * 5;
      const baseHumidity = 60 + Math.cos(i / 8) * 15;
      const basePressure = 1013 + Math.sin(i / 12) * 20;
      const basePower = 150 + Math.sin(i / 6) * 50 + Math.random() * 20;
      const baseVoltage = 220 + Math.sin(i / 15) * 10;
      const baseCurrent = 0.7 + Math.sin(i / 9) * 0.3;
      
      data.push({
        time: timeRange === '1h' ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
              timeRange === '24h' ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) :
              time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: time.getTime(),
        temperature: Math.round(baseTemp * 10) / 10,
        humidity: Math.round(baseHumidity * 10) / 10,
        pressure: Math.round(basePressure * 10) / 10,
        power: Math.round(basePower * 10) / 10,
        voltage: Math.round(baseVoltage * 10) / 10,
        current: Math.round(baseCurrent * 100) / 100,
        co2: Math.round((400 + Math.sin(i / 7) * 100 + Math.random() * 50) * 10) / 10,
        light: Math.round((500 + Math.sin(i / 11) * 300 + Math.random() * 100) * 10) / 10,
        noise: Math.round((45 + Math.sin(i / 13) * 15 + Math.random() * 10) * 10) / 10
      });
    }
    return data;
  }, [timeRange]);

  const checkForAlerts = useCallback(async (data) => {
    if (!data || data.length === 0) return;
    
    const latestData = data[data.length - 1];
    const alertsToCreate = [];

    if (latestData.temperature > 30) {
      alertsToCreate.push({
        type: 'temperature_high',
        severity: latestData.temperature > 35 ? 'critical' : 'high',
        message: `High temperature detected: ${latestData.temperature}°C`,
        device_id: devices[0]?.id || null
      });
    }

    if (latestData.humidity > 80) {
      alertsToCreate.push({
        type: 'humidity_high',
        severity: 'medium',
        message: `High humidity detected: ${latestData.humidity}%`,
        device_id: devices[0]?.id || null
      });
    }

    if (latestData.power > 200) {
      alertsToCreate.push({
        type: 'power_high',
        severity: 'high',
        message: `High power consumption: ${latestData.power}W`,
        device_id: devices[0]?.id || null
      });
    }

    for (const alert of alertsToCreate) {
      try {
        const { data: newAlert, error } = await supabase
          .from('alerts')
          .insert([alert])
          .select()
          .single();

        if (!error && user?.email) {
          await sendAlertNotification({
            email: user.email,
            alert: { ...alert, id: newAlert.id }
          });
        }
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    }
  }, [devices, user]);

  const sendAlertNotification = async ({ email, alert }) => {
    try {
      const { error } = await supabase.functions.invoke('send-alert-notification', {
        body: {
          email,
          alert: {
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
      } else {
        toast({
          title: "Alert Notification Sent",
          description: `Alert notification sent to ${email}`,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const newData = generateRealTimeData();
      setTelemetryData(newData);
      setPowerData(newData);

      await checkForAlerts(newData);

      const statusData = [
        { name: 'Online', value: activeDevices, color: '#10B981' },
        { name: 'Offline', value: offlineDevices, color: '#EF4444' },
        { name: 'Warning', value: warningDevices, color: '#F59E0B' }
      ].filter(item => item.value > 0);
      setDeviceStatusData(statusData);

      const alertsChartData = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        alertsChartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          critical: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 8),
          low: Math.floor(Math.random() * 12)
        });
      }
      setAlertsData(alertsChartData);

      const { count } = await supabase
        .from('audit_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      setActiveUsers(Math.max(1, count || 1));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [generateRealTimeData, checkForAlerts, activeDevices, offlineDevices, warningDevices]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      if (timeRange === '1h') {
        fetchData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, timeRange, fetchData]);

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-dashboard-data', {
        body: {
          format,
          data: {
            telemetry: telemetryData,
            devices,
            alerts,
            timeRange
          }
        }
      });

      if (error) throw error;

      const blob = new Blob([data.content], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Dashboard data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard data",
        variant: "destructive"
      });
    }
  };

  const handleZoomIn = () => {
    if (telemetryData.length === 0) return;
    const dataLength = telemetryData.length;
    const start = Math.floor(dataLength * 0.25);
    const end = Math.floor(dataLength * 0.75);
    setZoomDomain([start, end]);
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">IoT Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={handleZoomIn}
            disabled={!telemetryData.length}
          >
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom In
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            disabled={!zoomDomain}
          >
            <ZoomOut className="w-4 h-4 mr-2" />
            Zoom Out
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Activity className={`w-4 h-4 mr-2 ${realTimeEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            {realTimeEnabled ? 'Live' : 'Paused'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

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
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-indigo-600">{activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Environmental Sensors</span>
              </div>
              {realTimeEnabled && <Badge variant="secondary" className="bg-green-50 text-green-700">Live</Badge>}
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
                <XAxis 
                  dataKey="time" 
                  domain={zoomDomain || ['dataMin', 'dataMax']}
                />
                <YAxis />
                <Tooltip />
                <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="5 5" label="Temp Alert" />
                <Area type="monotone" dataKey="temperature" stroke="#3B82F6" fillOpacity={1} fill="url(#tempGradient)" />
                <Area type="monotone" dataKey="humidity" stroke="#06B6D4" fillOpacity={1} fill="url(#humidityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Power Consumption</span>
              </div>
              {realTimeEnabled && <Badge variant="secondary" className="bg-green-50 text-green-700">Live</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={powerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  domain={zoomDomain || ['dataMin', 'dataMax']}
                />
                <YAxis />
                <Tooltip />
                <ReferenceLine y={200} stroke="#F59E0B" strokeDasharray="5 5" label="High Usage" />
                <Line type="monotone" dataKey="power" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="voltage" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="current" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>Alert Trends (Last 7 Days)</CardTitle>
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
    </div>
  );
};
