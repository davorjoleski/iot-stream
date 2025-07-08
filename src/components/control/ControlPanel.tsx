
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Power, 
  Settings, 
  Zap, 
  Thermometer, 
  Fan, 
  Lightbulb,
  Send,
  Code,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export const ControlPanel = () => {
  const [selectedDevice, setSelectedDevice] = useState("DEV-001");
  const [customCommand, setCustomCommand] = useState("");
  const [temperature, setTemperature] = useState([22]);
  const [fanSpeed, setFanSpeed] = useState([50]);
  const [lightBrightness, setLightBrightness] = useState([75]);
  const [devicePower, setDevicePower] = useState(true);
  const { toast } = useToast();

  const devices = [
    { id: "DEV-001", name: "Temperature Sensor A1", type: "sensor", status: "online" },
    { id: "DEV-002", name: "Cooling System F6", type: "hvac", status: "online" },
    { id: "DEV-003", name: "Motor Controller E5", type: "motor", status: "online" },
    { id: "DEV-004", name: "LED Panel G7", type: "lighting", status: "online" },
    { id: "DEV-005", name: "Pump Station H8", type: "pump", status: "offline" }
  ];

  const sendCommand = (command: string, params?: any) => {
    console.log(`Sending command: ${command}`, params);
    toast({
      title: "Command Sent",
      description: `${command} command sent to ${selectedDevice}`,
    });
  };

  const sendCustomCommand = () => {
    if (!customCommand.trim()) return;
    
    try {
      JSON.parse(customCommand); // Validate JSON
      sendCommand("Custom JSON", JSON.parse(customCommand));
      setCustomCommand("");
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please enter valid JSON command",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Device Control Center</h2>
          <p className="text-muted-foreground">Send commands and control connected IoT devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            <Zap className="w-3 h-3 mr-1" />
            Real-time Control
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Device</CardTitle>
            <CardDescription>Choose a device to control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedDevice === device.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => setSelectedDevice(device.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{device.name}</div>
                      <div className="text-xs text-muted-foreground">{device.id}</div>
                    </div>
                    <Badge 
                      variant={device.status === "online" ? "secondary" : "destructive"}
                      className={device.status === "online" ? "bg-green-100 text-green-800" : ""}
                    >
                      {device.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Device Controls</span>
            </CardTitle>
            <CardDescription>
              Control settings for {devices.find(d => d.id === selectedDevice)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quick" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quick">Quick Controls</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="custom">Custom Commands</TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="space-y-6">
                {/* Power Control */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Power className={`w-5 h-5 ${devicePower ? "text-green-600" : "text-gray-400"}`} />
                    <div>
                      <div className="font-medium">Device Power</div>
                      <div className="text-sm text-muted-foreground">Turn device on/off</div>
                    </div>
                  </div>
                  <Switch 
                    checked={devicePower} 
                    onCheckedChange={(checked) => {
                      setDevicePower(checked);
                      sendCommand(checked ? "POWER_ON" : "POWER_OFF");
                    }}
                  />
                </div>

                {/* Temperature Control */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <div className="font-medium">Temperature Setting</div>
                      <div className="text-sm text-muted-foreground">Set target temperature</div>
                    </div>
                    <div className="text-lg font-semibold">{temperature[0]}°C</div>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={(value) => {
                      setTemperature(value);
                      sendCommand("SET_TEMPERATURE", { temperature: value[0] });
                    }}
                    max={35}
                    min={15}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Fan Speed Control */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <Fan className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Fan Speed</div>
                      <div className="text-sm text-muted-foreground">Adjust cooling fan speed</div>
                    </div>
                    <div className="text-lg font-semibold">{fanSpeed[0]}%</div>
                  </div>
                  <Slider
                    value={fanSpeed}
                    onValueChange={(value) => {
                      setFanSpeed(value);
                      sendCommand("SET_FAN_SPEED", { speed: value[0] });
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Lighting Control */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium">Brightness</div>
                      <div className="text-sm text-muted-foreground">Adjust LED brightness</div>
                    </div>
                    <div className="text-lg font-semibold">{lightBrightness[0]}%</div>
                  </div>
                  <Slider
                    value={lightBrightness}
                    onValueChange={(value) => {
                      setLightBrightness(value);
                      sendCommand("SET_BRIGHTNESS", { brightness: value[0] });
                    }}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => sendCommand("RESTART")} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart Device
                  </Button>
                  <Button onClick={() => sendCommand("CALIBRATE")} variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Calibrate Sensors
                  </Button>
                  <Button onClick={() => sendCommand("RESET_FACTORY")} variant="destructive" className="w-full">
                    <Power className="w-4 h-4 mr-2" />
                    Factory Reset
                  </Button>
                  <Button onClick={() => sendCommand("RUN_DIAGNOSTICS")} variant="outline" className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Run Diagnostics
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Recent Commands</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>SET_TEMPERATURE</span>
                      <span className="text-muted-foreground">2 min ago</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>POWER_ON</span>
                      <span className="text-muted-foreground">5 min ago</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>SET_FAN_SPEED</span>
                      <span className="text-muted-foreground">8 min ago</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <h4 className="font-medium">Send Custom JSON Command</h4>
                  </div>
                  <Textarea
                    placeholder='{"command": "SET_MODE", "parameters": {"mode": "auto", "duration": 3600}}'
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    className="font-mono text-sm"
                    rows={6}
                  />
                  <Button onClick={sendCustomCommand} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Command
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Command Examples</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-muted/50 rounded font-mono">
                      {`{"command": "SET_SCHEDULE", "time": "14:30"}`}
                    </div>
                    <div className="p-2 bg-muted/50 rounded font-mono">
                      {`{"action": "TOGGLE", "target": "all"}`}
                    </div>
                    <div className="p-2 bg-muted/50 rounded font-mono">
                      {`{"mode": "emergency", "priority": "high"}`}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
