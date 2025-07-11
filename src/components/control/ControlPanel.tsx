import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Power, 
  RotateCcw, 
  Settings, 
  Play, 
  Pause, 
  AlertTriangle,
  Zap,
  Thermometer,
  Activity,
  RefreshCw,
  Wrench,
  Target,
  Gauge
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { AutomationHub } from "@/components/automation/AutomationHub";
import { AutomationEngine } from "@/components/automation/AutomationEngine";

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  last_seen: string;
  configuration: any;
}

interface ControlPanelProps {
  devices: Device[];
  onDevicesChange?: () => void;
}

export const ControlPanel = ({ devices, onDevicesChange }: ControlPanelProps) => {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [customCommand, setCustomCommand] = useState("");
  const [commandOutput, setCommandOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const activeDevices = devices.filter(device => device.status === 'online');

  const executeDeviceCommand = async (deviceId: string, command: string, parameters?: any) => {
    setIsExecuting(true);
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) throw new Error('Device not found');

      // Simulate command execution with WebSocket/MQTT
      const commandId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      // Log the command execution
      await logAction('DEVICE_COMMAND', 'device', deviceId, {
        command,
        parameters,
        device_name: device.name,
        command_id: commandId
      });

      // Simulate different command responses
      let response = '';
      let newStatus = device.status;
      
      switch (command) {
        case 'restart':
          response = `Device ${device.name} restarting...`;
          newStatus = 'offline';
          setTimeout(async () => {
            await supabase
              .from('devices')
              .update({ 
                status: 'online', 
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', deviceId);
            onDevicesChange?.();
            addCommandOutput(`Device ${device.name} restarted successfully`);
          }, 3000);
          break;
          
        case 'factory_reset':
          response = `Factory reset initiated for ${device.name}`;
          newStatus = 'maintenance';
          setTimeout(async () => {
            await supabase
              .from('devices')
              .update({ 
                status: 'online',
                configuration: {},
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', deviceId);
            onDevicesChange?.();
            addCommandOutput(`Factory reset completed for ${device.name}`);
          }, 5000);
          break;
          
        case 'calibrate':
          response = `Calibrating sensors on ${device.name}...`;
          setTimeout(() => {
            addCommandOutput(`Sensor calibration completed for ${device.name}`);
          }, 2000);
          break;
          
        case 'diagnostics':
          response = `Running diagnostics on ${device.name}...`;
          setTimeout(() => {
            addCommandOutput(`Diagnostics completed for ${device.name}:
- CPU Usage: 45%
- Memory Usage: 62%
- Network Latency: 12ms
- Sensor Status: OK
- Last Error: None`);
          }, 3000);
          break;
          
        case 'power_off':
          response = `Powering off ${device.name}`;
          newStatus = 'offline';
          break;
          
        case 'power_on':
          response = `Powering on ${device.name}`;
          newStatus = 'online';
          break;
          
        default:
          response = `Executing custom command "${command}" on ${device.name}`;
      }

      // Update device status if changed
      if (newStatus !== device.status) {
        await supabase
          .from('devices')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString(),
            last_seen: newStatus === 'online' ? new Date().toISOString() : device.last_seen
          })
          .eq('id', deviceId);
        onDevicesChange?.();
      }

      addCommandOutput(response);
      
      toast({
        title: "Command Executed",
        description: `${command} command sent to ${device.name}`,
      });

    } catch (error) {
      console.error('Error executing command:', error);
      addCommandOutput(`Error: ${error.message}`);
      toast({
        title: "Command Failed",
        description: `Failed to execute ${command}`,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const addCommandOutput = (output: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCommandOutput(prev => [...prev, `[${timestamp}] ${output}`]);
  };

  const executeCustomCommand = async () => {
    if (!selectedDevice || !customCommand.trim()) return;
    
    await executeDeviceCommand(selectedDevice, customCommand.trim());
    setCustomCommand("");
  };

  const clearOutput = () => {
    setCommandOutput([]);
  };

  return (
    <div className="space-y-6">
      {/* Background automation engine */}
      <AutomationEngine />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Device Control Panel</h2>
          <p className="text-muted-foreground">Remote control and management of IoT devices</p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {activeDevices.length} Devices Online
        </Badge>
      </div>

      <Tabs defaultValue="quick-actions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Controls</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDevices.map((device) => (
              <Card key={device.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="truncate">{device.name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{device.type}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeDeviceCommand(device.id, 'restart')}
                      disabled={isExecuting}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Restart
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeDeviceCommand(device.id, 'diagnostics')}
                      disabled={isExecuting}
                      className="text-xs"
                    >
                      <Gauge className="w-3 h-3 mr-1" />
                      Diagnostics
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeDeviceCommand(device.id, 'calibrate')}
                      disabled={isExecuting}
                      className="text-xs"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Calibrate
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Wrench className="w-3 h-3 mr-1" />
                          Advanced
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Advanced Controls - {device.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => executeDeviceCommand(device.id, 'factory_reset')}
                              disabled={isExecuting}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Factory Reset
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => executeDeviceCommand(device.id, 'power_off')}
                              disabled={isExecuting}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              Power Off
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Warning</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              Factory reset will erase all device configuration and data.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <Badge 
                    variant={device.status === 'online' ? 'default' : 'destructive'}
                    className="w-full justify-center"
                  >
                    {device.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Command Execution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Execute custom commands on selected devices
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="device-select">Select Device</Label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a device" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} ({device.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom-command">Custom Command</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="custom-command"
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      placeholder="Enter command (e.g., set_temperature 25)"
                      onKeyPress={(e) => e.key === 'Enter' && executeCustomCommand()}
                    />
                    <Button 
                      onClick={executeCustomCommand}
                      disabled={!selectedDevice || !customCommand.trim() || isExecuting}
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Command Output</CardTitle>
              <Button variant="outline" size="sm" onClick={clearOutput}>
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {commandOutput.length === 0 ? (
                  <p className="text-slate-400">No commands executed yet...</p>
                ) : (
                  commandOutput.map((line, index) => (
                    <div key={index} className="mb-1">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutomationHub />
        </TabsContent>
      </Tabs>
    </div>
  );
};
