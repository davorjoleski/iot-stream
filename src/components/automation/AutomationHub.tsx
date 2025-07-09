
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Activity,
  AlertTriangle,
  Zap,
  Mail,
  Webhook,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_conditions: any;
  actions: any;
  created_at: string;
  updated_at: string;
}

export const AutomationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [triggerType, setTriggerType] = useState('sensor');
  const [sensorType, setSensorType] = useState('temperature');
  const [condition, setCondition] = useState('greater_than');
  const [threshold, setThreshold] = useState('');
  const [actionType, setActionType] = useState('email');
  const [actionConfig, setActionConfig] = useState('');

  useEffect(() => {
    if (user) {
      fetchAutomationRules();
    }
  }, [user]);

  const fetchAutomationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch automation rules",
        variant: "destructive"
      });
    }
  };

  const createAutomationRule = async () => {
    if (!ruleName.trim() || !threshold) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const triggerConditions = {
        type: triggerType,
        sensor: sensorType,
        condition: condition,
        threshold: parseFloat(threshold),
        duration: 300 // 5 minutes default
      };

      const actions = {
        type: actionType,
        config: actionType === 'email' ? {
          recipient: user?.email,
          subject: `IoT Alert: ${ruleName}`,
          message: `Automation rule "${ruleName}" has been triggered. ${sensorType} ${condition} ${threshold}.`
        } : actionType === 'webhook' ? {
          url: actionConfig,
          method: 'POST'
        } : {
          message: actionConfig
        }
      };

      const { error } = await supabase
        .from('automation_workflows')
        .insert([{
          name: ruleName,
          description: ruleDescription,
          user_id: user?.id,
          trigger_conditions: triggerConditions,
          actions: actions,
          enabled: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation rule created successfully",
      });

      resetForm();
      setShowCreateDialog(false);
      fetchAutomationRules();
    } catch (error) {
      console.error('Error creating automation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create automation rule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ enabled: !enabled })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Automation rule ${!enabled ? 'enabled' : 'disabled'}`,
      });

      fetchAutomationRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule",
        variant: "destructive"
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation rule deleted successfully",
      });

      fetchAutomationRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation rule",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setRuleName('');
    setRuleDescription('');
    setTriggerType('sensor');
    setSensorType('temperature');
    setCondition('greater_than');
    setThreshold('');
    setActionType('email');
    setActionConfig('');
    setEditingRule(null);
  };

  const getRuleStatusColor = (rule: AutomationRule) => {
    if (!rule.enabled) return 'secondary';
    return 'default';
  };

  const formatTriggerDescription = (rule: AutomationRule) => {
    const trigger = rule.trigger_conditions;
    if (trigger.type === 'sensor') {
      return `When ${trigger.sensor} is ${trigger.condition.replace('_', ' ')} ${trigger.threshold}`;
    }
    return 'Custom trigger';
  };

  const formatActionDescription = (rule: AutomationRule) => {
    const action = rule.actions;
    switch (action.type) {
      case 'email':
        return `Send email to ${action.config?.recipient || 'user'}`;
      case 'webhook':
        return `Call webhook: ${action.config?.url || 'configured URL'}`;
      case 'notification':
        return 'Send push notification';
      default:
        return 'Custom action';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Automation Hub</h2>
          <p className="text-muted-foreground mt-1">Create and manage intelligent automation workflows</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Set up intelligent automation to respond to device conditions and events
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="trigger">Trigger</TabsTrigger>
                <TabsTrigger value="action">Action</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., High Temperature Alert"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    placeholder="Describe what this rule does..."
                    value={ruleDescription}
                    onChange={(e) => setRuleDescription(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="trigger" className="space-y-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sensor">Sensor Condition</SelectItem>
                      <SelectItem value="device">Device Status</SelectItem>
                      <SelectItem value="time">Time-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerType === 'sensor' && (
                  <>
                    <div className="space-y-2">
                      <Label>Sensor Type</Label>
                      <Select value={sensorType} onValueChange={setSensorType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temperature">Temperature</SelectItem>
                          <SelectItem value="humidity">Humidity</SelectItem>
                          <SelectItem value="pressure">Pressure</SelectItem>
                          <SelectItem value="power">Power Consumption</SelectItem>
                          <SelectItem value="co2">CO2 Level</SelectItem>
                          <SelectItem value="light">Light Level</SelectItem>
                          <SelectItem value="noise">Noise Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select value={condition} onValueChange={setCondition}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_than">Greater than</SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="equal_to">Equal to</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Threshold Value</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Rules are checked every 30 seconds. Conditions must persist for 5 minutes before triggering.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="action" className="space-y-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Send Email</SelectItem>
                      <SelectItem value="webhook">Call Webhook</SelectItem>
                      <SelectItem value="notification">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {actionType === 'webhook' && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://your-webhook-url.com/notify"
                      value={actionConfig}
                      onChange={(e) => setActionConfig(e.target.value)}
                    />
                  </div>
                )}

                {actionType === 'notification' && (
                  <div className="space-y-2">
                    <Label>Notification Message</Label>
                    <Textarea
                      placeholder="Custom notification message..."
                      value={actionConfig}
                      onChange={(e) => setActionConfig(e.target.value)}
                    />
                  </div>
                )}

                {actionType === 'email' && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Email will be sent to your registered email address: {user?.email}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createAutomationRule} disabled={loading}>
                {loading ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automation Rules List */}
      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Automation Rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation rule to start intelligent monitoring
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRuleStatusColor(rule)}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id, rule.enabled)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Trigger:</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatTriggerDescription(rule)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">Action:</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatActionDescription(rule)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(rule.created_at).toLocaleDateString()}
                    {rule.updated_at !== rule.created_at && (
                      <span> • Updated: {new Date(rule.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
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
