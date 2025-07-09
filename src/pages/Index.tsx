
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { ControlPanel } from "@/components/control/ControlPanel";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { WebSocketManager } from "@/components/websocket/WebSocketManager";
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import { AutomationHub } from "@/components/automation/AutomationHub";
import { AutomationEngine } from "@/components/automation/AutomationEngine";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Settings, Bell, BarChart3, Shield, LogOut, Wifi, WifiOff, Zap, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchData();
    setupRealtimeSubscriptions();
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

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleWebSocketMessage = (message: any) => {
    console.log('WebSocket message:', message);
    if (message.type === 'device_update' || message.type === 'telemetry') {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      <WebSocketManager 
        onMessage={handleWebSocketMessage}
        onStatusChange={setWsConnected}
      />
      <AutomationEngine />
      
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              IoT Control Hub
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant={wsConnected ? "default" : "destructive"} className="hidden sm:flex">
              {wsConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {wsConnected ? "Live Data" : "Offline"}
            </Badge>
            
            <span className="text-sm text-muted-foreground hidden md:block">
              Welcome, {user.email}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 lg:w-auto lg:grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="control" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Control</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Telemetry</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview devices={devices} alerts={alerts} />
          </TabsContent>

          <TabsContent value="devices">
            <DeviceManagement 
              devices={devices} 
              onDeviceSelect={setSelectedDevice}
              selectedDevice={selectedDevice}
              onDevicesChange={fetchData}
            />
          </TabsContent>

          <TabsContent value="control">
            <ControlPanel devices={devices} onDevicesChange={fetchData} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel alerts={alerts} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationHub />
          </TabsContent>

          <TabsContent value="telemetry">
            <TelemetryChart />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
