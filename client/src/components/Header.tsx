import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, LogOut, User, X, CheckCheck, AlertTriangle, Info, Calendar, Edit3, Mail, Phone, MapPin, Building, UserCircle } from "lucide-react";

// Storage Usage Component
function StorageUsageDisplay() {
  const { data: storageInfo } = useQuery<{storageUsed: number; storageLimit: number; storageAvailable: number}>({
    queryKey: ["/api/user/storage"],
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!storageInfo) {
    return <div className="text-slate-400">Loading storage info...</div>;
  }

  const storageUsedPercent = Math.round((storageInfo.storageUsed / storageInfo.storageLimit) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Used Storage</span>
        <span className="text-sm text-slate-400">
          {formatFileSize(storageInfo.storageUsed)} / {formatFileSize(storageInfo.storageLimit)}
        </span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all ${
            storageUsedPercent > 90 ? 'bg-red-500' : 
            storageUsedPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{storageUsedPercent}% used</span>
        <span>{formatFileSize(storageInfo.storageAvailable)} available</span>
      </div>
    </div>
  );
}
import siwatLogoPath from "@assets/siwath_logo_withoutbackground_1755357359703.png";

export default function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // Initialize notifications from localStorage or use defaults
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
    
    // Default notifications - only shown on first visit
    return [
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
    ];
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);

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
    setShowProfile(true);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'agent': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'engineer': return 'bg-green-500/20 text-green-400 border-green-400/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
    }
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
                  <p className="text-sm font-medium text-white" data-testid="text-username">{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</p>
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

      {/* User Profile Modal */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <UserCircle className="h-6 w-6 text-indigo-400" />
              User Profile
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View and manage your account information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
            {/* Profile Header */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-white">
                        {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User'}
                      </h2>
                      <Badge className={`${getRoleColor(user?.role || '')} border text-sm`}>
                        {user?.role || 'User'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      Member since {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Account Information */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Info className="h-5 w-5 text-blue-400" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 mb-2 block">Full Name</Label>
                    <Input 
                      value={user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || ''} 
                      readOnly 
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Username</Label>
                    <Input 
                      value={user?.username || ''} 
                      readOnly 
                      className="bg-slate-800/50 border-slate-700 text-slate-200"
                      data-testid="input-profile-username"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-200">
                        {user?.email || 'Not provided'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Role</Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      <Badge className={`${getRoleColor(user?.role || '')} border`}>
                        {user?.role || 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StorageUsageDisplay />
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-400 mb-1">
                      {user?.id || '1'}
                    </div>
                    <div className="text-sm text-slate-400">User ID</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      Active
                    </div>
                    <div className="text-sm text-slate-400">Status</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-slate-400">Last Login</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowProfile(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                data-testid="button-close-profile"
              >
                Close
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled
                data-testid="button-edit-profile"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile (Coming Soon)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
