
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Shield, 
  TrendingUp, 
  Wifi 
} from "lucide-react";

interface DashboardStatsProps {
  activeDevices: number;
  totalDevices: number;
  criticalAlerts: number;
}

export const DashboardStats = ({ activeDevices, totalDevices, criticalAlerts }: DashboardStatsProps) => {
  const uptime = 99.8;
  const dataProcessed = 2.4;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          <Wifi className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeDevices}/{totalDevices}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((activeDevices / totalDevices) * 100)}% online
          </p>
          <Badge variant="secondary" className="mt-2">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Require immediate attention
          </p>
          <Badge variant="destructive" className="mt-2">
            High Priority
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
          <Shield className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uptime}%</div>
          <p className="text-xs text-muted-foreground">
            Last 30 days average
          </p>
          <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700">
            Excellent
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
          <Database className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dataProcessed}TB</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12%
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
