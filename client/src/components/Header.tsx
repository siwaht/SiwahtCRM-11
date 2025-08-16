import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, LogOut, User, X, CheckCheck, AlertTriangle, Info, Calendar } from "lucide-react";
import siwatLogoPath from "@assets/siwath_logo_withoutbackground_1755357359703.png";

export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'lead',
      title: 'New Lead Assigned',
      message: 'Michael Johnson from TechStartup Inc has been assigned to you',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'webhook',
      title: 'Webhook Test Successful',
      message: 'n8n webhook test completed successfully',
      time: '5 minutes ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      title: 'Database Backup Complete',
      message: 'Automatic backup completed successfully',
      time: '1 hour ago',
      read: false
    }
  ]);

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared",
    });
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead': return <User className="h-4 w-4 text-blue-400" />;
      case 'webhook': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'system': return <Info className="h-4 w-4 text-green-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileClick = () => {
    toast({
      title: "Profile Menu",
      description: "User profile settings and preferences coming soon!",
    });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-slate-900/80 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src={siwatLogoPath} 
                alt="Siwaht Logo" 
                className="w-full h-full object-contain"
              />
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
              onClick={handleNotifications}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-slate-800/30 px-3 py-2 rounded-xl">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/30 rounded-lg px-2 py-1 transition-colors flex-1"
                onClick={handleProfileClick}
                data-testid="button-user-profile"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white" data-testid="text-username">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize" data-testid="text-userrole">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="p-1 hover:bg-slate-700/50"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 text-slate-400 hover:text-slate-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <Button
                  onClick={clearAllNotifications}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-300"
                  data-testid="button-clear-all-notifications"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-slate-800/30 border-slate-700/50 text-slate-300' 
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-100'
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-slate-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="p-1 hover:bg-slate-600"
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              <CheckCheck className="h-3 w-3 text-green-400" />
                            </Button>
                          )}
                          <Button
                            onClick={() => removeNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-slate-600 text-red-400"
                            data-testid={`button-remove-notification-${notification.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
