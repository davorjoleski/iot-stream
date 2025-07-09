
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Brush
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Thermometer, 
  Droplets, 
  Gauge,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause
} from "lucide-react";

export const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature', 'humidity', 'power']);
  const [zoomDomain, setZoomDomain] = useState(null);
  
  // Data states
  const [sensorData, setSensorData] = useState([]);
  const [powerAnalytics, setPowerAnalytics] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);

  const generateAdvancedData = useCallback(() => {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : timeRange === '7d' ? 168 : 720;
    const intervalMs = timeRange === '1h' ? 60000 : timeRange === '24h' ? 600000 : timeRange === '7d' ? 3600000 : 3600000;
    
    const data = [];
    const powerData = [];
    const envData = [];
    const perfData = [];
    const corrData = [];
    const effData = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      const timeStr = timeRange === '1h' ? 
        time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
        timeRange === '24h' ? 
        time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) :
        time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });

      // Environmental sensors
      const temp = 22 + Math.sin(i / 10) * 8 + Math.random() * 4;
      const humidity = 55 + Math.cos(i / 8) * 20 + Math.random() * 10;
      const pressure = 1013 + Math.sin(i / 12) * 25 + Math.random() * 5;
      const co2 = 400 + Math.sin(i / 6) * 150 + Math.random() * 50;
      const light = 300 + Math.sin(i / 14) * 200 + Math.random() * 100;
      const noise = 40 + Math.sin(i / 9) * 20 + Math.random() * 10;
      const airQuality = 50 + Math.sin(i / 11) * 30 + Math.random() * 20;

      // Power and electrical
      const power = 120 + Math.sin(i / 7) * 80 + Math.random() * 30;
      const voltage = 220 + Math.sin(i / 15) * 15 + Math.random() * 5;
      const current = power / voltage;
      const frequency = 50 + Math.sin(i / 20) * 1 + Math.random() * 0.5;
      const powerFactor = 0.85 + Math.sin(i / 13) * 0.1 + Math.random() * 0.05;

      // Performance metrics
      const cpuUsage = 30 + Math.sin(i / 8) * 40 + Math.random() * 20;
      const memoryUsage = 45 + Math.sin(i / 12) * 30 + Math.random() * 15;
      const networkLatency = 10 + Math.sin(i / 6) * 20 + Math.random() * 10;
      const diskIO = 20 + Math.sin(i / 9) * 30 + Math.random() * 15;
      const responseTime = 50 + Math.sin(i / 11) * 100 + Math.random() * 30;

      // Efficiency metrics
      const efficiency = Math.max(60, 100 - (cpuUsage + memoryUsage) / 2 + Math.random() * 10);
      const uptime = Math.max(95, 100 - Math.random() * 5);
      const throughput = 1000 + Math.sin(i / 7) * 300 + Math.random() * 100;

      data.push({
        time: timeStr,
        timestamp: time.getTime(),
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        pressure: Math.round(pressure * 10) / 10,
        co2: Math.round(co2),
        light: Math.round(light),
        noise: Math.round(noise * 10) / 10,
        airQuality: Math.round(airQuality)
      });

      powerData.push({
        time: timeStr,
        power: Math.round(power * 10) / 10,
        voltage: Math.round(voltage * 10) / 10,
        current: Math.round(current * 100) / 100,
        frequency: Math.round(frequency * 10) / 10,
        powerFactor: Math.round(powerFactor * 100) / 100,
        consumption: Math.round(power * intervalMs / 3600000 * 10) / 10 // kWh
      });

      perfData.push({
        time: timeStr,
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryUsage: Math.round(memoryUsage * 10) / 10,
        networkLatency: Math.round(networkLatency * 10) / 10,
        diskIO: Math.round(diskIO * 10) / 10,
        responseTime: Math.round(responseTime)
      });

      effData.push({
        time: timeStr,
        efficiency: Math.round(efficiency * 10) / 10,
        uptime: Math.round(uptime * 10) / 10,
        throughput: Math.round(throughput),
        errorRate: Math.max(0, Math.round((5 - efficiency / 20) * 10) / 10)
      });

      // Correlation data (temperature vs power consumption)
      corrData.push({
        temperature: temp,
        power: power,
        efficiency: efficiency,
        humidity: humidity,
        time: timeStr
      });
    }

    setSensorData(data);
    setPowerAnalytics(powerData);
    setEnvironmentalData(data);
    setPerformanceMetrics(perfData);
    setCorrelationData(corrData);
    setEfficiencyData(effData);
  }, [timeRange]);

  useEffect(() => {
    generateAdvancedData();
  }, [generateAdvancedData]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      if (timeRange === '1h') {
        generateAdvancedData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, timeRange, generateAdvancedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    generateAdvancedData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleZoomIn = () => {
    if (sensorData.length === 0) return;
    const dataLength = sensorData.length;
    const start = Math.floor(dataLength * 0.25);
    const end = Math.floor(dataLength * 0.75);
    setZoomDomain([start, end]);
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };

  const exportData = (format: 'csv' | 'pdf') => {
    console.log(`Exporting analytics data as ${format}`);
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground mt-1">Comprehensive sensor and system analytics with real-time insights</p>
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
            disabled={!sensorData.length}
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
            Reset Zoom
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {realTimeEnabled ? 'Pause' : 'Resume'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="environmental" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="power">Power & Energy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
        </TabsList>

        <TabsContent value="environmental" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature & Humidity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <span>Temperature & Humidity</span>
                  </div>
                  {realTimeEnabled && <Badge variant="secondary" className="bg-green-50 text-green-700">Live</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={environmentalData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="5 5" label="Temp Alert" />
                    <ReferenceLine y={80} stroke="#3B82F6" strokeDasharray="5 5" label="Humidity Alert" />
                    <Area type="monotone" dataKey="temperature" stroke="#F97316" fillOpacity={1} fill="url(#tempGrad)" />
                    <Area type="monotone" dataKey="humidity" stroke="#06B6D4" fillOpacity={1} fill="url(#humidGrad)" />
                    <Brush dataKey="time" height={30} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Air Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <span>Air Quality & Environment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={environmentalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={400} stroke="#F59E0B" strokeDasharray="5 5" label="CO2 Normal" />
                    <Line type="monotone" dataKey="co2" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="light" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="noise" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="airQuality" stroke="#10B981" strokeWidth={2} />
                    <Brush dataKey="time" height={30} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pressure Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gauge className="w-5 h-5 text-purple-600" />
                  <span>Atmospheric Pressure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={environmentalData}>
                    <defs>
                      <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={1013} stroke="#10B981" strokeDasharray="5 5" label="Sea Level" />
                    <Area type="monotone" dataKey="pressure" stroke="#8B5CF6" fillOpacity={1} fill="url(#pressureGrad)" />
                    <Brush dataKey="time" height={30} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Environmental Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Environmental Overview</CardTitle>
                <CardDescription>Current environmental conditions radar</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[{
                    metric: 'Temperature',
                    value: environmentalData[environmentalData.length - 1]?.temperature || 0,
                    fullMark: 50
                  }, {
                    metric: 'Humidity',
                    value: environmentalData[environmentalData.length - 1]?.humidity || 0,
                    fullMark: 100
                  }, {
                    metric: 'Air Quality',
                    value: environmentalData[environmentalData.length - 1]?.airQuality || 0,
                    fullMark: 100
                  }, {
                    metric: 'Light',
                    value: (environmentalData[environmentalData.length - 1]?.light || 0) / 10,
                    fullMark: 100
                  }, {
                    metric: 'Noise',
                    value: environmentalData[environmentalData.length - 1]?.noise || 0,
                    fullMark: 100
                  }]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="power" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Power Consumption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span>Power Consumption</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={powerAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="5 5" label="High Usage" />
                    <Line type="monotone" dataKey="power" stroke="#F59E0B" strokeWidth={3} />
                    <Brush dataKey="time" height={30} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Electrical Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Electrical Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={powerAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="voltage" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="current" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="frequency" stroke="#8B5CF6" strokeWidth={2} />
                    <Brush dataKey="time" height={30} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Energy Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Energy Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={powerAnalytics}>
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="consumption" stroke="#10B981" fillOpacity={1} fill="url(#energyGrad)" />
                    <Brush dataKey="time" height={30} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Power Factor */}
            <Card>
              <CardHeader>
                <CardTitle>Power Factor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={powerAnalytics.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="powerFactor" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke="#EF4444" fill="#EF4444" />
                    <Area type="monotone" dataKey="memoryUsage" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                    <Brush dataKey="time" height={30} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Network & I/O */}
            <Card>
              <CardHeader>
                <CardTitle>Network & I/O Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="networkLatency" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="diskIO" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="responseTime" stroke="#8B5CF6" strokeWidth={2} />
                    <Brush dataKey="time" height={30} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Trends */}
            <Card>
              <CardHeader>
                <CardTitle>System Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={efficiencyData}>
                    <defs>
                      <linearGradient id="efficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="5 5" label="Target" />
                    <Area type="monotone" dataKey="efficiency" stroke="#10B981" fillOpacity={1} fill="url(#efficiencyGrad)" />
                    <Brush dataKey="time" height={30} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Uptime & Reliability */}
            <Card>
              <CardHeader>
                <CardTitle>Uptime & Reliability</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" domain={zoomDomain || ['dataMin', 'dataMax']} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={3} />
                    <Line type="monotone" dataKey="errorRate" stroke="#EF4444" strokeWidth={2} />
                    <Brush dataKey="time" height={30} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature vs Power Correlation */}
            <Card>
              <CardHeader>
                <CardTitle>Temperature vs Power Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="temperature" name="Temperature" unit="°C" />
                    <YAxis dataKey="power" name="Power" unit="W" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Correlation" dataKey="power" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Multi-factor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-factor Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="humidity" name="Humidity" unit="%" />
                    <YAxis dataKey="efficiency" name="Efficiency" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Analysis" dataKey="efficiency" fill="#82ca9d" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
