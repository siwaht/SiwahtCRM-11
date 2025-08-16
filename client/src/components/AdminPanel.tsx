import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Webhook, 
  Bot,
  UserPlus,
  Edit,
  Ban,
  Plus,
  Trash2,
  TestTube,
  Activity,
  Search,
  MessageSquare,
  UserCheck,
  BarChart
} from "lucide-react";
import UserForm from "./UserForm";
import WebhookForm from "./WebhookForm";
import type { User, Webhook as WebhookType } from "@shared/schema";

const roleColors = {
  admin: "bg-red-500/20 text-red-400",
  agent: "bg-indigo-500/20 text-indigo-400",
  engineer: "bg-amber-500/20 text-amber-400",
};

const mcpTools = [
  { name: "create_lead", description: "Create new leads from AI agents", icon: UserPlus, status: "active" },
  { name: "get_leads", description: "Retrieve lead data with filters", icon: Search, status: "active" },
  { name: "update_lead", description: "Update lead status and information", icon: Edit, status: "active" },
  { name: "add_interaction", description: "Add interactions to leads", icon: MessageSquare, status: "active" },
  { name: "get_analytics", description: "Retrieve sales analytics data", icon: BarChart, status: "active" },
  { name: "manage_products", description: "Manage product catalog", icon: Bot, status: "active" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Users queries and mutations
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
    },
  });

  // Webhooks queries and mutations
  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ["/api/webhooks"],
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete webhook",
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/webhooks/${id}/test`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test webhook sent successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test webhook",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleEditWebhook = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    setShowWebhookForm(true);
  };

  const handleDeleteWebhook = (id: number) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      deleteWebhookMutation.mutate(id);
    }
  };

  const handleTestWebhook = (id: number) => {
    testWebhookMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-slate-400 mt-1">System configuration and user management</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/30 border border-slate-700/50 p-1">
          <TabsTrigger 
            value="users" 
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            data-testid="tab-users"
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="webhooks"
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            data-testid="tab-webhooks"
          >
            <Webhook className="h-4 w-4" />
            <span>Webhooks</span>
          </TabsTrigger>
          <TabsTrigger 
            value="mcp"
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            data-testid="tab-mcp"
          >
            <Bot className="h-4 w-4" />
            <span>AI Integration</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Button
              onClick={() => {
                setEditingUser(null);
                setShowUserForm(true);
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              data-testid="button-add-user"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>

          <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Last Login</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-slate-800/20" data-testid={`row-user-${user.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-user-name-${user.id}`}>{user.name}</p>
                            <p className="text-sm text-slate-400" data-testid={`text-user-email-${user.id}`}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={user.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Never"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Webhooks Management */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhook Configuration</h3>
            <Button
              onClick={() => {
                setEditingWebhook(null);
                setShowWebhookForm(true);
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              data-testid="button-add-webhook"
            >
              <Plus className="h-4 w-4" />
              <span>Add Webhook</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {webhooks.map((webhook: WebhookType) => (
              <Card
                key={webhook.id}
                className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50"
                data-testid={`card-webhook-${webhook.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold" data-testid={`text-webhook-name-${webhook.id}`}>{webhook.name}</h4>
                      <p className="text-sm text-slate-400 mt-1 truncate" data-testid={`text-webhook-url-${webhook.id}`}>
                        {webhook.url}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${webhook.isActive ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                      <span className={`text-xs ${webhook.isActive ? "text-emerald-400" : "text-slate-400"}`}>
                        {webhook.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-400 mb-2">EVENTS:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events?.map((event, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-slate-700/50 text-slate-300"
                          data-testid={`badge-event-${webhook.id}-${index}`}
                        >
                          {event}
                        </Badge>
                      )) || (
                        <span className="text-xs text-slate-500">No events configured</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>
                      Last triggered: {webhook.lastTriggered 
                        ? new Date(webhook.lastTriggered).toLocaleDateString()
                        : "Never"
                      }
                    </span>
                    <span>Status: Healthy</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook.id)}
                      disabled={testWebhookMutation.isPending}
                      className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 border-slate-600"
                      data-testid={`button-test-webhook-${webhook.id}`}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWebhook(webhook)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg"
                      data-testid={`button-edit-webhook-${webhook.id}`}
                    >
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                      data-testid={`button-delete-webhook-${webhook.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {webhooks.length === 0 && (
            <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Webhook className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Webhooks Configured</h3>
                <p className="text-slate-400 mb-6">Add webhooks to integrate with external services and get real-time notifications.</p>
                <Button
                  onClick={() => {
                    setEditingWebhook(null);
                    setShowWebhookForm(true);
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Webhook
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MCP AI Integration */}
        <TabsContent value="mcp" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Agent Integration (MCP)</h3>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>

          {/* MCP Server Status */}
          <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">WebSocket Server Status</h4>
                  <p className="text-sm text-slate-400">Port 5003 • Model Context Protocol</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-emerald-400">Online</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold" data-testid="stat-active-connections">3</p>
                  <p className="text-xs text-slate-400">Active Connections</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" data-testid="stat-messages-today">247</p>
                  <p className="text-xs text-slate-400">Messages Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" data-testid="stat-uptime">99.2%</p>
                  <p className="text-xs text-slate-400">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Tools */}
          <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Available AI Tools</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mcpTools.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                      data-testid={`card-mcp-tool-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-tool-name-${index}`}>{tool.name}</p>
                          <p className="text-xs text-slate-400" data-testid={`text-tool-description-${index}`}>{tool.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        {tool.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {showWebhookForm && (
        <WebhookForm
          webhook={editingWebhook}
          onClose={() => {
            setShowWebhookForm(false);
            setEditingWebhook(null);
          }}
        />
      )}
    </div>
  );
}
