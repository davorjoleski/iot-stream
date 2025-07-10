
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Zap, User, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppHeaderProps {
  user: any;
  wsConnected: boolean;
  onSignOut: () => void;
}

export const AppHeader = ({ user, wsConnected, onSignOut }: AppHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IoT Stream
              </h1>
            </div>
            
            <Badge 
              variant={wsConnected ? "default" : "secondary"} 
              className="text-xs hidden sm:flex"
            >
              <Zap className="w-3 h-3 mr-1" />
              {wsConnected ? "Live Data" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-6 h-6 md:w-8 md:h-8">
                <AvatarFallback className="text-xs">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span className="text-xs md:text-sm truncate max-w-32 md:max-w-none">
                  {user?.email}
                </span>
              </div>
            </div>
            
            <ThemeToggle />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSignOut}
              className="flex items-center gap-1 md:gap-2"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline text-xs md:text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
