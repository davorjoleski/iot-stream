
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertNotificationRequest {
  email: string;
  alert: {
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, alert }: AlertNotificationRequest = await req.json();

    // For demo purposes, we'll just log the notification
    // In production, you would integrate with a service like Resend, SendGrid, etc.
    console.log('Sending alert notification:', {
      to: email,
      alert: alert,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending
    const emailContent = {
      to: email,
      subject: `IoT Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">IoT Control Hub Alert</h1>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e1e5e9; border-radius: 0 0 8px 8px;">
            <div style="background: ${alert.severity === 'critical' ? '#fee2e2' : alert.severity === 'high' ? '#fef3c7' : '#e0f2fe'}; 
                        color: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#d97706' : '#0369a1'}; 
                        padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px;">
                ${alert.severity.toUpperCase()} ALERT
              </h2>
              <p style="margin: 0; font-size: 16px;">${alert.message}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; color: #374151;">Alert Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Alert ID:</td>
                  <td style="padding: 8px 0; color: #374151;">${alert.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Type:</td>
                  <td style="padding: 8px 0; color: #374151;">${alert.type.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Severity:</td>
                  <td style="padding: 8px 0; color: #374151;">${alert.severity}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Timestamp:</td>
                  <td style="padding: 8px 0; color: #374151;">${new Date(alert.timestamp).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://mrwanozupkjsdesqevzd.supabase.co" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; 
                        border-radius: 6px; font-weight: 500; display: inline-block;">
                View Dashboard
              </a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                        text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated alert from your IoT Control Hub system.</p>
              <p>If you believe this is an error, please check your automation rules.</p>
            </div>
          </div>
        </div>
      `
    };

    // Log successful email simulation
    console.log('Email notification would be sent:', emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert notification sent successfully',
        emailPreview: emailContent
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error sending alert notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
