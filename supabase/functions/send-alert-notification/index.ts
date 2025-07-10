
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  email: string;
  alert: {
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  };
}

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  type: 'welcome' | 'reset_password' | 'confirm_email';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (body.type === 'welcome' || body.type === 'confirm_email' || body.type === 'reset_password') {
      return await handleAuthEmail(body as WelcomeEmailRequest);
    } else {
      return await handleAlertEmail(body as AlertEmailRequest);
    }
  } catch (error: any) {
    console.error("Error in send-alert-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handleAlertEmail({ email, alert }: AlertEmailRequest): Promise<Response> {
  const severityColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  };

  const emailResponse = await resend.emails.send({
    from: "IoT Control Hub <alerts@iot-control.com>",
    to: [email],
    subject: `${alert.severity.toUpperCase()} Alert: ${alert.type.replace('_', ' ')}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>IoT Alert Notification</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; color: white; background-color: ${severityColor[alert.severity as keyof typeof severityColor] || '#6b7280'}; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 IoT Alert Notification</h1>
              <p>Your IoT system requires attention</p>
            </div>
            <div class="content">
              <div class="alert-badge">${alert.severity.toUpperCase()}</div>
              <h2>${alert.type.replace('_', ' ').toUpperCase()}</h2>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
              <p><strong>Alert ID:</strong> ${alert.id}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
              <p>Please check your IoT Control Hub dashboard for more details and to acknowledge this alert.</p>
              <a href="https://your-iot-dashboard.com" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Open Dashboard</a>
            </div>
            <div class="footer">
              <p>IoT Control Hub - Monitoring your devices 24/7</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function handleAuthEmail({ email, name, type }: WelcomeEmailRequest): Promise<Response> {
  let subject = "";
  let title = "";
  let content = "";

  switch (type) {
    case 'welcome':
      subject = "Welcome to IoT Control Hub!";
      title = "🎉 Welcome to IoT Control Hub";
      content = `
        <p>Hello ${name || 'there'}!</p>
        <p>Thank you for joining IoT Control Hub - your comprehensive solution for monitoring and managing IoT devices.</p>
        <h3>What you can do:</h3>
        <ul>
          <li>📊 Monitor real-time telemetry data from your devices</li>
          <li>🚨 Receive instant alerts when issues arise</li>
          <li>🔧 Control and configure your IoT devices remotely</li>
          <li>📈 Analyze historical data and trends</li>
          <li>⚡ Set up automated workflows and rules</li>
        </ul>
        <p>Get started by logging into your dashboard and adding your first device!</p>
      `;
      break;
    case 'confirm_email':
      subject = "Confirm Your Email - IoT Control Hub";
      title = "📧 Confirm Your Email Address";
      content = `
        <p>Hello!</p>
        <p>Please confirm your email address to complete your registration with IoT Control Hub.</p>
        <p>Once confirmed, you'll have full access to all features including:</p>
        <ul>
          <li>Device monitoring and control</li>
          <li>Real-time alerts and notifications</li>
          <li>Advanced analytics and reporting</li>
          <li>Automation workflows</li>
        </ul>
      `;
      break;
    case 'reset_password':
      subject = "Reset Your Password - IoT Control Hub";
      title = "🔒 Password Reset Request";
      content = `
        <p>Hello!</p>
        <p>We received a request to reset your password for your IoT Control Hub account.</p>
        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <p>For security reasons, this link will expire in 24 hours.</p>
      `;
      break;
  }

  const emailResponse = await resend.emails.send({
    from: "IoT Control Hub <no-reply@iot-control.com>",
    to: [email],
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; line-height: 1.6; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
              <p>Your Smart IoT Management Platform</p>
            </div>
            <div class="content">
              ${content}
              <a href="https://your-iot-dashboard.com" class="btn">Access Your Dashboard</a>
            </div>
            <div class="footer">
              <p><strong>IoT Control Hub</strong> - Empowering your IoT ecosystem</p>
              <p>📧 support@iot-control.com | 🌐 www.iot-control.com</p>
              <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(handler);
