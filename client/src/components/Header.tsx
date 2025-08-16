import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Brain, LogOut, User } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-slate-900/80 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Siwaht CRM</h1>
              <p className="text-xs text-slate-400">AI Service Platform</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-slate-400" />
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-slate-800/30 px-3 py-2 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium" data-testid="text-username">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize" data-testid="text-userrole">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="p-1"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 text-slate-400 hover:text-slate-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
