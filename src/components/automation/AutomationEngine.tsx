
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger_conditions: {
    type: string;
    sensor: string;
    condition: string;
    threshold: number;
    duration?: number;
  };
  actions: {
    type: string;
    config: any;
  };
}

interface TelemetryData {
  device_id: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  power?: number;
  voltage?: number;
  current?: number;
  timestamp: string;
}

export const AutomationEngine = () => {
  const { toast } = useToast();
  const rulesRef = useRef<AutomationRule[]>([]);
  const telemetryBufferRef = useRef<Map<string, TelemetryData[]>>(new Map());
  const alertCooldownRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    loadAutomationRules();
    const interval = setInterval(checkAutomationRules, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadAutomationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedRules: AutomationRule[] = (data || []).map(rule => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled || false,
        trigger_conditions: rule.trigger_conditions as any,
        actions: rule.actions as any,
      }));
      
      rulesRef.current = transformedRules;
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  };

  const checkAutomationRules = async () => {
    if (rulesRef.current.length === 0) return;

    try {
      // Get recent telemetry data
      const { data: telemetryData, error } = await supabase
        .from('telemetry')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Process each rule
      for (const rule of rulesRef.current) {
        await processRule(rule, telemetryData || []);
      }
    } catch (error) {
      console.error('Error checking automation rules:', error);
    }
  };

  const processRule = async (rule: AutomationRule, telemetryData: TelemetryData[]) => {
    const { trigger_conditions } = rule;
    
    if (trigger_conditions.type === 'sensor') {
      const sensorData = telemetryData.filter(data => {
        const value = data[trigger_conditions.sensor as keyof TelemetryData];
        return typeof value === 'number';
      });

      if (sensorData.length === 0) return;

      const latestData = sensorData[0];
      const sensorValue = latestData[trigger_conditions.sensor as keyof TelemetryData] as number;
      
      let conditionMet = false;
      
      switch (trigger_conditions.condition) {
        case 'greater_than':
          conditionMet = sensorValue > trigger_conditions.threshold;
          break;
        case 'less_than':
          conditionMet = sensorValue < trigger_conditions.threshold;
          break;
        case 'equal_to':
          conditionMet = Math.abs(sensorValue - trigger_conditions.threshold) < 0.1;
          break;
      }

      if (conditionMet) {
        const cooldownKey = `${rule.id}-${latestData.device_id}`;
        const lastAlert = alertCooldownRef.current.get(cooldownKey) || 0;
        const now = Date.now();
        
        // Prevent spam - only trigger once every 5 minutes per rule/device
        if (now - lastAlert > 5 * 60 * 1000) {
          await executeAction(rule, latestData, sensorValue);
          alertCooldownRef.current.set(cooldownKey, now);
        }
      }
    }
  };

  const executeAction = async (rule: AutomationRule, telemetryData: TelemetryData, triggerValue: number) => {
    const { actions } = rule;
    
    // Create alert in database
    try {
      const alertMessage = `${rule.name}: ${rule.trigger_conditions.sensor} ${rule.trigger_conditions.condition.replace('_', ' ')} ${rule.trigger_conditions.threshold} (current: ${triggerValue})`;
      
      const { error: alertError } = await supabase
        .from('alerts')
        .insert([{
          type: 'automation_trigger',
          message: alertMessage,
          severity: triggerValue > rule.trigger_conditions.threshold * 1.5 ? 'critical' : 'high',
          device_id: telemetryData.device_id,
          status: 'active'
        }]);

      if (alertError) throw alertError;

      // Execute action
      switch (actions.type) {
        case 'email':
          await sendEmailNotification(rule, telemetryData, triggerValue);
          break;
        case 'webhook':
          await callWebhook(rule, telemetryData, triggerValue);
          break;
        case 'notification':
          toast({
            title: "Automation Triggered",
            description: `${rule.name}: ${rule.trigger_conditions.sensor} = ${triggerValue}`,
            variant: triggerValue > rule.trigger_conditions.threshold * 1.5 ? 'destructive' : 'default',
          });
          break;
      }
    } catch (error) {
      console.error('Error executing automation action:', error);
    }
  };

  const sendEmailNotification = async (rule: AutomationRule, telemetryData: TelemetryData, triggerValue: number) => {
    try {
      const { error } = await supabase.functions.invoke('send-alert-notification', {
        body: {
          email: rule.actions.config?.recipient || 'user@example.com',
          alert: {
            id: crypto.randomUUID(),
            type: rule.trigger_conditions.sensor,
            severity: triggerValue > rule.trigger_conditions.threshold * 1.5 ? 'critical' : 'high',
            message: `${rule.name}: ${rule.trigger_conditions.sensor} value is ${triggerValue} (threshold: ${rule.trigger_conditions.threshold})`,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  const callWebhook = async (rule: AutomationRule, telemetryData: TelemetryData, triggerValue: number) => {
    try {
      const webhookUrl = rule.actions.config?.url;
      if (!webhookUrl) return;

      const payload = {
        rule: rule.name,
        trigger: rule.trigger_conditions,
        value: triggerValue,
        device: telemetryData.device_id,
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error calling webhook:', error);
    }
  };

  return null; // This is a background service component
};
