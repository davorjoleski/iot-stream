
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  format: 'csv' | 'pdf';
  data: {
    telemetry: any[];
    devices: any[];
    alerts: any[];
    timeRange: string;
  };
}

const generateCSV = (data: any) => {
  const { telemetry, devices, alerts, timeRange } = data;
  
  let csv = `IoT Dashboard Export - ${timeRange}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Telemetry data
  csv += "TELEMETRY DATA\n";
  csv += "Time,Temperature,Humidity,Pressure,Power,Voltage,Current,CO2,Light,Noise\n";
  
  telemetry.forEach(row => {
    csv += `${row.time},${row.temperature || ''},${row.humidity || ''},${row.pressure || ''},${row.power || ''},${row.voltage || ''},${row.current || ''},${row.co2 || ''},${row.light || ''},${row.noise || ''}\n`;
  });
  
  csv += "\n\nDEVICE STATUS\n";
  csv += "Name,Type,Status,Location,Last Seen\n";
  
  devices.forEach(device => {
    csv += `${device.name},${device.type},${device.status},${device.location || ''},${device.last_seen || ''}\n`;
  });
  
  csv += "\n\nALERTS\n";
  csv += "Message,Severity,Status,Created At,Acknowledged\n";
  
  alerts.forEach(alert => {
    csv += `${alert.message},${alert.severity},${alert.status},${alert.created_at},${alert.acknowledged || 'No'}\n`;
  });
  
  return csv;
};

const generatePDFContent = (data: any) => {
  // This is a simplified PDF content - in production you'd use a proper PDF library
  const { telemetry, devices, alerts, timeRange } = data;
  
  return `
    IoT Dashboard Report
    Time Range: ${timeRange}
    Generated: ${new Date().toISOString()}
    
    SUMMARY:
    - Total Devices: ${devices.length}
    - Active Devices: ${devices.filter(d => d.status === 'online').length}
    - Total Alerts: ${alerts.length}
    - Critical Alerts: ${alerts.filter(a => a.severity === 'critical').length}
    
    LATEST TELEMETRY:
    ${telemetry.slice(-5).map(t => 
      `Time: ${t.time}, Temp: ${t.temperature}°C, Humidity: ${t.humidity}%, Power: ${t.power}W`
    ).join('\n')}
    
    DEVICE STATUS:
    ${devices.map(d => 
      `${d.name} (${d.type}): ${d.status}`
    ).join('\n')}
    
    RECENT ALERTS:
    ${alerts.slice(0, 10).map(a => 
      `[${a.severity.toUpperCase()}] ${a.message} - ${new Date(a.created_at).toLocaleDateString()}`
    ).join('\n')}
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { format, data }: ExportRequest = await req.json();

    let content: string;
    let contentType: string;

    if (format === 'csv') {
      content = generateCSV(data);
      contentType = 'text/csv';
    } else if (format === 'pdf') {
      content = generatePDFContent(data);
      contentType = 'application/pdf';
    } else {
      throw new Error('Unsupported format');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        contentType,
        filename: `iot-dashboard-${format}-${new Date().toISOString().split('T')[0]}`
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
    console.error('Export error:', error);
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
