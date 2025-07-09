
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Bell, Mail, MessageSquare, Plus, Settings, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Alert {
  id: string;
  device_id: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  acknowledged: boolean;
  created_at: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [devices, setDevices] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,  
    push_notifications: true,
    alert_types: ["critical", "warning"] as string[],
    phone_number: ""
  });
  const [newAlert, setNewAlert] = useState({
    device_id: "",
    type: "threshold",
    severity: "medium",
    message: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (!user) return;

    // Fetch devices for alert creation
    const fetchDevices = async () => {
      const { data } = await supabase.from('devices').select('id, name, type');
      setDevices(data || []);
    };

    // Fetch notification settings
    const fetchNotificationSettings = async () => {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNotificationSettings({
          email_notifications: data.email_notifications || true,
          sms_notifications: data.sms_notifications || false,
          push_notifications: data.push_notifications || true,
          alert_types: Array.isArray(data.alert_types) ? data.alert_types as string[] : ["critical", "warning"],
          phone_number: data.phone_number || ""
        });
      }
    };

    fetchDevices();
    fetchNotificationSettings();
  }, [user]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      await logAction('ACKNOWLEDGE_ALERT', 'alert', alertId);

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged.",
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          device_id: newAlert.device_id || null,
          type: newAlert.type,
          severity: newAlert.severity,
          message: newAlert.message,
          status: 'active',
          acknowledged: false
        }])
        .select()
        .single();

      if (error) throw error;

      await logAction('CREATE_ALERT', 'alert', data.id, {
        alert_type: newAlert.type,
        severity: newAlert.severity
      });

      toast({
        title: "Alert Created",
        description: "New alert rule has been created successfully.",
      });

      setNewAlert({ device_id: "", type: "threshold", severity: "medium", message: "" });
      setShowCreateAlert(false);
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user?.id,
          ...notificationSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await logAction('UPDATE_NOTIFICATION_SETTINGS', 'notification_settings', user?.id);

      toast({
        title: "Settings Saved",
        description: "Notification preferences have been updated.",
      });

      setShowNotificationSettings(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Management</h2>
          <p className="text-muted-foreground">Monitor system alerts and configure notifications</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Alert Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
              </DialogHeader>
              <form onSubmit={createAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label>Device (Optional)</Label>
                  <Select value={newAlert.device_id} onValueChange={(value) => setNewAlert({...newAlert, device_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device or leave blank for system-wide" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device: any) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} ({device.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alert Type</Label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert({...newAlert, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="threshold">Threshold Alert</SelectItem>
                      <SelectItem value="connectivity">Connectivity Alert</SelectItem>
                      <SelectItem value="performance">Performance Alert</SelectItem>
                      <SelectItem value="security">Security Alert</SelectItem>
                      <SelectItem value="maintenance">Maintenance Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={newAlert.severity} onValueChange={(value) => setNewAlert({...newAlert, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                    placeholder="Describe the alert condition..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateAlert(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Alert</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure Notifications
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        email_notifications: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <Label>SMS Notifications</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.sms_notifications}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        sms_notifications: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <Label>Push Notifications</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.push_notifications}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        push_notifications: checked
                      })}
                    />
                  </div>
                </div>

                {notificationSettings.sms_notifications && (
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={notificationSettings.phone_number}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        phone_number: e.target.value
                      })}
                      placeholder="+1234567890"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNotificationSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveNotificationSettings}>
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts List */}
      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className="text-muted-foreground">Your system is running smoothly!</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                    </div>
                    <p className="font-medium mb-1">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged ? (
                      <Button
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Acknowledge
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        <Check className="w-3 h-3 mr-1" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
