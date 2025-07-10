
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Settings, Bell, BarChart3, Shield, Zap, Cog } from "lucide-react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { ControlPanel } from "@/components/control/ControlPanel";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import { AutomationHub } from "@/components/automation/AutomationHub";

interface AppTabsProps {
  devices: any[];
  alerts: any[];
  selectedDevice: any;
  onDeviceSelect: (device: any) => void;
  onDevicesChange: () => void;
}

export const AppTabs = ({ 
  devices, 
  alerts, 
  selectedDevice, 
  onDeviceSelect, 
  onDevicesChange 
}: AppTabsProps) => {
  return (
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
          onDeviceSelect={onDeviceSelect}
          selectedDevice={selectedDevice}
          onDevicesChange={onDevicesChange}
        />
      </TabsContent>

      <TabsContent value="control">
        <ControlPanel devices={devices} onDevicesChange={onDevicesChange} />
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
  );
};
