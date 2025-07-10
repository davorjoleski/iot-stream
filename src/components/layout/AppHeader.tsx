
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, WifiOff, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  user: any;
  wsConnected: boolean;
  onSignOut: () => void;
}

export const AppHeader = ({ user, wsConnected, onSignOut }: AppHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            IoT Control Hub
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={wsConnected ? "default" : "destructive"} className="hidden sm:flex">
            {wsConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {wsConnected ? "Live Data" : "Offline"}
          </Badge>
          
          <span className="text-sm text-muted-foreground hidden md:block">
            Welcome, {user.email}
          </span>
          <Button onClick={onSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
