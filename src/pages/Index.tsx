
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RealtimeManager } from "@/components/realtime/RealtimeManager";
import { AutomationEngine } from "@/components/automation/AutomationEngine";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppTabs } from "@/components/layout/AppTabs";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { devices, alerts, selectedDevice, setSelectedDevice, fetchData } = useAppData(user);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleRealtimeMessage = (message: any) => {
    console.log('Realtime message:', message);
    if (message.type === 'device_update' || message.type === 'telemetry') {
      fetchData();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
      <RealtimeManager 
        onMessage={handleRealtimeMessage}
        onStatusChange={setRealtimeConnected}
      />
      <AutomationEngine />
      
      <AppHeader 
        user={user}
        wsConnected={realtimeConnected}
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <AppTabs
          devices={devices}
          alerts={alerts}
          selectedDevice={selectedDevice}
          onDeviceSelect={setSelectedDevice}
          onDevicesChange={fetchData}
        />
      </div>
    </div>
  );
};

export default Index;
