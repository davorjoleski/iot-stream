
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: null, // Could be populated from a service
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  return { logAction };
};
