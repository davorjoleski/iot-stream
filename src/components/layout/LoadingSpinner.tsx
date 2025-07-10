
import { Activity } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};
