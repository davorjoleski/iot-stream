
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertTriangle, 
  Check, 
  Database, 
  Gauge, 
  Power, 
  Settings, 
  Shield, 
  Thermometer, 
  Wifi, 
  WifiOff,
  Plus,
  Bell,
  BarChart3,
  Users,
  Zap
} from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DeviceGrid } from "@/components/devices/DeviceGrid";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { ControlPanel } from "@/components/control/ControlPanel";

const Index = () => {
  const [activeDevices, setActiveDevices] = useState(12);
  const [totalDevices, setTotalDevices] = useState(15);
  const [criticalAlerts, setCriticalAlerts] = useState(2);
  const [activeTab, setActiveTab] = useState("overview");

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDevices(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  IoT Control Hub
                </h1>
              </div>
              <Badge variant="secondary" className="ml-4">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts ({criticalAlerts})
              </Button>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Stats */}
        <DashboardStats 
          activeDevices={activeDevices}
          totalDevices={totalDevices}
          criticalAlerts={criticalAlerts}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Devices</span>
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Telemetry</span>
            </TabsTrigger>
            <TabsTrigger value="control" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Control</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>System Health Overview</span>
                  </CardTitle>
                  <CardDescription>Real-time system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Network I/O</span>
                        <span>23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    <span>Environmental Status</span>
                  </CardTitle>
                  <CardDescription>Current environmental readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">24°C</div>
                      <div className="text-sm text-muted-foreground">Temperature</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">65%</div>
                      <div className="text-sm text-muted-foreground">Humidity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <TelemetryChart />
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <DeviceGrid />
          </TabsContent>

          <TabsContent value="telemetry" className="mt-6">
            <div className="space-y-6">
              <TelemetryChart />
              <Card>
                <CardHeader>
                  <CardTitle>Live Data Stream</CardTitle>
                  <CardDescription>Real-time telemetry from all connected devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                        <span className="text-muted-foreground">
                          {new Date(Date.now() - i * 1000).toLocaleTimeString()}
                        </span>
                        <span>Device-{String(i + 1).padStart(3, '0')}</span>
                        <span className="font-mono">
                          Temp: {(20 + Math.random() * 10).toFixed(1)}°C
                        </span>
                        <Badge variant={Math.random() > 0.7 ? "destructive" : "secondary"}>
                          {Math.random() > 0.7 ? "Alert" : "Normal"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="control" className="mt-6">
            <ControlPanel />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <AlertsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
