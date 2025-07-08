
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Thermometer, 
  Droplets, 
  Zap, 
  Gauge, 
  Wifi, 
  WifiOff, 
  Plus, 
  Search,
  Settings,
  Power,
  MoreVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const mockDevices = [
  {
    id: "DEV-001",
    name: "Temperature Sensor A1",
    type: "Temperature Sensor",
    location: "Server Room",
    status: "online",
    lastSeen: "2 min ago",
    temperature: 24.5,
    icon: Thermometer,
    color: "text-blue-600"
  },
  {
    id: "DEV-002",
    name: "Humidity Monitor B2",
    type: "Humidity Sensor",
    location: "Warehouse",
    status: "online",
    lastSeen: "1 min ago",
    humidity: 65,
    icon: Droplets,
    color: "text-cyan-600"
  },
  {
    id: "DEV-003",
    name: "Power Monitor C3",
    type: "Power Sensor",
    location: "Main Panel",
    status: "offline",
    lastSeen: "15 min ago",
    power: 0,
    icon: Zap,
    color: "text-yellow-600"
  },
  {
    id: "DEV-004",
    name: "Pressure Gauge D4",
    type: "Pressure Sensor",
    location: "Pump Station",
    status: "online",
    lastSeen: "30 sec ago",
    pressure: 2.4,
    icon: Gauge,
    color: "text-green-600"
  },
  {
    id: "DEV-005",
    name: "Motor Controller E5",
    type: "Actuator",
    location: "Production Line",
    status: "online",
    lastSeen: "1 min ago",
    speed: 1850,
    icon: Settings,
    color: "text-purple-600"
  },
  {
    id: "DEV-006",
    name: "Cooling System F6",
    type: "Environmental Control",
    location: "Data Center",
    status: "warning",
    lastSeen: "45 sec ago",
    temperature: 28.9,
    icon: Thermometer,
    color: "text-orange-600"
  }
];

export const DeviceGrid = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredDevices = mockDevices.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedType === "all" || device.type === selectedType)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Wifi className="w-3 h-3 mr-1" />Online</Badge>;
      case "offline":
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Offline</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDeviceValue = (device: any) => {
    if (device.temperature !== undefined) return `${device.temperature}°C`;
    if (device.humidity !== undefined) return `${device.humidity}%`;
    if (device.power !== undefined) return `${device.power}W`;
    if (device.pressure !== undefined) return `${device.pressure} bar`;
    if (device.speed !== undefined) return `${device.speed} RPM`;
    return "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Device Management</h2>
          <p className="text-muted-foreground">Monitor and control all connected IoT devices</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="Temperature Sensor">Temperature Sensors</option>
          <option value="Humidity Sensor">Humidity Sensors</option>
          <option value="Power Sensor">Power Sensors</option>
          <option value="Pressure Sensor">Pressure Sensors</option>
          <option value="Actuator">Actuators</option>
          <option value="Environmental Control">Environmental Control</option>
        </select>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const IconComponent = device.icon;
          return (
            <Card key={device.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${device.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{device.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{device.type}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Power className="w-4 h-4 mr-2" />
                      {device.status === "online" ? "Turn Off" : "Turn On"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(device.status)}
                    <span className="text-sm text-muted-foreground">{device.lastSeen}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-muted-foreground">{device.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Value:</span>
                    <span className={`text-sm font-mono ${device.status === "online" ? "text-primary" : "text-muted-foreground"}`}>
                      {getDeviceValue(device)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    ID: {device.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
