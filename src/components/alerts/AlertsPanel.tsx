
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Bell, 
  Check, 
  Clock, 
  Filter, 
  Plus, 
  Search,
  X,
  Mail,
  Smartphone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockAlerts = [
  {
    id: "ALT-001",
    device: "Temperature Sensor A1",
    type: "Critical",
    message: "Temperature exceeded 30°C threshold",
    timestamp: "2024-01-15 14:30:22",
    status: "active",
    severity: "high",
    acknowledged: false
  },
  {
    id: "ALT-002",
    device: "Power Monitor C3",
    type: "Warning",
    message: "Device offline for more than 10 minutes",
    timestamp: "2024-01-15 14:15:10",
    status: "active",
    severity: "medium",
    acknowledged: false
  },
  {
    id: "ALT-003",
    device: "Humidity Monitor B2",
    type: "Info",
    message: "Humidity levels back to normal",
    timestamp: "2024-01-15 13:45:33",
    status: "resolved",
    severity: "low",
    acknowledged: true
  },
  {
    id: "ALT-004",
    device: "Cooling System F6",
    type: "Critical",
    message: "Cooling system efficiency below 70%",
    timestamp: "2024-01-15 13:20:15",
    status: "active",
    severity: "high",
    acknowledged: true
  },
  {
    id: "ALT-005",
    device: "Motor Controller E5",
    type: "Warning",
    message: "Unusual vibration patterns detected",
    timestamp: "2024-01-15 12:55:42",
    status: "investigating",
    severity: "medium",
    acknowledged: true
  }
];

export const AlertsPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [activeTab, setActiveTab] = useState("active");

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = alert.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === "all" || alert.severity === selectedSeverity;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && alert.status === "active") ||
                      (activeTab === "resolved" && alert.status === "resolved") ||
                      (activeTab === "investigating" && alert.status === "investigating");
    
    return matchesSearch && matchesSeverity && matchesTab;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">Critical</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case "low":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Active</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      case "investigating":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Investigating</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Management</h2>
          <p className="text-muted-foreground">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Configure Notifications
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Alert Rule
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">4.2h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications Sent</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Severities</option>
            <option value="high">Critical</option>
            <option value="medium">Warning</option>
            <option value="low">Info</option>
          </select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Active ({mockAlerts.filter(a => a.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="investigating">Investigating ({mockAlerts.filter(a => a.status === 'investigating').length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({mockAlerts.filter(a => a.status === 'resolved').length})</TabsTrigger>
            <TabsTrigger value="all">All Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`hover:shadow-md transition-shadow ${
                  alert.severity === 'high' ? 'border-l-4 border-l-red-500' :
                  alert.severity === 'medium' ? 'border-l-4 border-l-yellow-500' :
                  'border-l-4 border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                          <span className="text-sm text-muted-foreground">#{alert.id}</span>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{alert.device}</h3>
                        <p className="text-muted-foreground mb-2">{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{alert.timestamp}</span>
                          {alert.acknowledged && (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && alert.status === 'active' && (
                          <Button size="sm" variant="outline">
                            <Check className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === 'active' && (
                          <Button size="sm" variant="outline">
                            <X className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
