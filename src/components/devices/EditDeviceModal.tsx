
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
}

interface EditDeviceModalProps {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceUpdated?: () => void;
}

export const EditDeviceModal = ({ device, open, onOpenChange, onDeviceUpdated }: EditDeviceModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    status: 'offline'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (device && open) {
      setFormData({
        name: device.name,
        type: device.type,
        location: device.location || '',
        status: device.status
      });
    }
  }, [device, open]);

  const deviceTypes = [
    'Temperature Sensor',
    'Humidity Sensor',
    'Power Sensor',
    'Pressure Sensor',
    'Actuator',
    'Environmental Control',
    'Gateway',
    'Controller'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('devices')
        .update({
          name: formData.name,
          type: formData.type,
          location: formData.location,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', device.id);

      if (error) throw error;

      await logAction('UPDATE_DEVICE', 'device', device.id, {
        device_name: formData.name,
        device_type: formData.type,
        changes: {
          name: { from: device.name, to: formData.name },
          type: { from: device.type, to: formData.type },
          location: { from: device.location, to: formData.location },
          status: { from: device.status, to: formData.status }
        }
      });

      toast({
        title: "Device Updated",
        description: `${formData.name} has been successfully updated.`,
      });

      onDeviceUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Device Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Temperature Sensor A1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Device Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Server Room, Warehouse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name || !formData.type}>
              {isSubmitting ? 'Updating...' : 'Update Device'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
