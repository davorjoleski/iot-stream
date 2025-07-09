
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  configuration JSONB DEFAULT '{}',
  telemetry_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telemetry table for real-time data
CREATE TABLE public.telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  temperature DECIMAL,
  humidity DECIMAL,
  pressure DECIMAL,
  power DECIMAL,
  voltage DECIMAL,
  current DECIMAL,
  data JSONB DEFAULT '{}'
);

-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  alert_types JSONB DEFAULT '["critical", "warning"]',
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_workflows table
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can view devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage devices" ON public.devices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage alerts" ON public.alerts FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view telemetry" ON public.telemetry FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert telemetry" ON public.telemetry FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their notification settings" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their workflows" ON public.automation_workflows FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for real-time updates
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.telemetry REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Insert sample data
INSERT INTO public.devices (name, type, location, status, last_seen, configuration, telemetry_data) VALUES
('Temperature Sensor A1', 'Temperature Sensor', 'Server Room', 'online', now() - interval '2 minutes', '{"threshold": 30, "unit": "celsius"}', '{"temperature": 24.5, "status": "normal"}'),
('Humidity Monitor B2', 'Humidity Sensor', 'Warehouse', 'online', now() - interval '1 minute', '{"threshold": 70, "unit": "percent"}', '{"humidity": 65, "status": "normal"}'),
('Power Monitor C3', 'Power Sensor', 'Main Panel', 'offline', now() - interval '15 minutes', '{"max_power": 1000}', '{"power": 0, "status": "offline"}'),
('Pressure Gauge D4', 'Pressure Sensor', 'Pump Station', 'online', now() - interval '30 seconds', '{"max_pressure": 5}', '{"pressure": 2.4, "status": "normal"}'),
('Motor Controller E5', 'Actuator', 'Production Line', 'online', now() - interval '1 minute', '{"max_speed": 2000}', '{"speed": 1850, "status": "running"}'),
('Cooling System F6', 'Environmental Control', 'Data Center', 'warning', now() - interval '45 seconds', '{"target_temp": 22}', '{"temperature": 28.9, "status": "warning"}');
