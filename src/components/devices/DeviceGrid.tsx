
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  MoreVertical,
  Activity
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DeviceDetailsModal } from "./DeviceDetailsModal";
import { AddDeviceModal } from "./AddDeviceModal";

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  last_seen: string;
  telemetry_data: any;
  configuration: any;
}

interface DeviceGridProps {
  devices: Device[];
  onDeviceSelect?: (device: Device) => void;
  selectedDevice?: Device | null;
}

export const DeviceGrid = ({ devices, onDeviceSelect, selectedDevice }: DeviceGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const { toast } = useToast();

  const filteredDevices = devices.filter(device => 
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

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'temperature sensor':
        return Thermometer;
      case 'humidity sensor':
        return Droplets;
      case 'power sensor':
        return Zap;
      case 'pressure sensor':
        return Gauge;
      default:
        return Activity;
    }
  };

  const getDeviceValue = (device: Device) => {
    const data = device.telemetry_data || {};
    if (data.temperature !== undefined) return `${data.temperature}°C`;
    if (data.humidity !== undefined) return `${data.humidity}%`;
    if (data.power !== undefined) return `${data.power}W`;
    if (data.pressure !== undefined) return `${data.pressure} bar`;
    if (data.speed !== undefined) return `${data.speed} RPM`;
    return "N/A";
  };

  const handleDeviceClick = (device: Device) => {
    onDeviceSelect?.(device);
    setShowDeviceDetails(true);
  };

  const toggleDevicePower = async (device: Device) => {
    const newStatus = device.status === 'online' ? 'offline' : 'online';
    
    try {
      const { error } = await supabase
        .from('devices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', device.id);

      if (error) throw error;

      toast({
        title: "Device Updated",
        description: `${device.name} has been turned ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Device Management</h2>
          <p className="text-muted-foreground">Monitor and control all connected IoT devices</p>
        </div>
        <Button onClick={() => setShowAddDevice(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
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
          const IconComponent = getDeviceIcon(device.type);
          const isSelected = selectedDevice?.id === device.id;
          
          return (
            <Card 
              key={device.id} 
              className={`hover:shadow-lg transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
              onClick={() => handleDeviceClick(device)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-muted/50 text-blue-600`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{device.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{device.type}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Configure logic */ }}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleDevicePower(device); }}>
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
                    <span className="text-sm text-muted-foreground">
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-muted-foreground">{device.location || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Value:</span>
                    <span className={`text-sm font-mono ${device.status === "online" ? "text-primary" : "text-muted-foreground"}`}>
                      {getDeviceValue(device)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    ID: {device.id.substring(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      <AddDeviceModal open={showAddDevice} onOpenChange={setShowAddDevice} />
      
      {selectedDevice && (
        <DeviceDetailsModal
          device={selectedDevice}
          open={showDeviceDetails}
          onOpenChange={setShowDeviceDetails}
        />
      )}
    </div>
  );
};
