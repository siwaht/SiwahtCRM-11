import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import WebhookForm from "./WebhookForm";
import UserForm from "./UserForm";
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
  Database,
  Download,
  Upload,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  Eye,
  Search,
  RotateCcw,
  Check,
  Filter
} from "lucide-react";
import type { User, Webhook as WebhookType, Product, Lead } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Users queries and mutations
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Webhooks queries and mutations
  const { data: webhooks = [], isLoading: webhooksLoading, error: webhooksError } = useQuery<WebhookType[]>({
    queryKey: ["/api/webhooks"],
  });

  // Products and Leads queries for statistics
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
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
      const response = await apiRequest("POST", `/api/webhooks/${id}/test`, {
        test: true,
        timestamp: new Date().toISOString()
      });
      return response.json();
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


  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Agent status updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent status",
      });
    },
  });

  // Database management mutations
  const exportDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/database/export");
      const data = await response.json();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `siwaht-crm-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database exported successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export database",
      });
    },
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/database");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries since data is cleared
      toast({
        title: "Success",
        description: "Database cleared successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear database",
      });
    },
  });

  // Handle file import
  const handleDatabaseImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a JSON file",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("database", file);

      const response = await fetch("/api/database/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Import failed");
      }

      queryClient.invalidateQueries(); // Invalidate all queries since data changed
      toast({
        title: "Success",
        description: "Database imported successfully",
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import database",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Admin Panel</h2>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">System configuration and user management</p>
        
      </div>

      {/* Simple Tabs */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            onClick={() => setActiveTab("users")}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial text-sm ${activeTab === "users" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden xs:inline">Agents</span>
            <span className="text-xs">({users.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial text-sm ${activeTab === "webhooks" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Webhook className="h-4 w-4" />
            <span className="hidden xs:inline">Webhooks</span>
            <span className="text-xs">({webhooks.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial text-sm ${activeTab === "mcp" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Bot className="h-4 w-4" />
            <span className="hidden xs:inline">AI</span>
          </Button>
          <Button
            onClick={() => setActiveTab("database")}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial text-sm ${activeTab === "database" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Database className="h-4 w-4" />
            <span className="hidden xs:inline">DB</span>
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Agent Management Header */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Agent Management</h3>
              <p className="text-slate-400">Manage your CRM agents and their access permissions</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
              <div className="relative flex-1 order-1 sm:order-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search agents by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder-slate-400"
                  data-testid="input-search-agents"
                />
              </div>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Results Count */}
            {usersLoading ? (
              <p className="text-slate-400">Loading agents...</p>
            ) : (
              <p className="text-slate-400 text-sm">
                Showing {users.filter(user => 
                  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} of {users.length} agents
              </p>
            )}

            {/* Agents Grid */}
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-slate-400 mt-4">Loading agents...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No agents found</p>
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    setShowUserForm(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="button-add-first-agent"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Agent
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {users
                  .filter(user => 
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => {
                    const getInitials = (name: string) => {
                      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    };

                    const getRoleBadgeColor = (role: string) => {
                      switch (role) {
                        case 'admin': return 'bg-red-500/20 text-red-400 border-red-400/30';
                        case 'agent': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
                        case 'engineer': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
                        default: return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
                      }
                    };

                    const getStatusBadgeColor = (isActive: boolean) => {
                      return isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                        : 'bg-slate-500/20 text-slate-400 border-slate-400/30';
                    };

                    return (
                      <div key={user.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
                        {/* Agent Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-semibold text-lg">{user.name}</h4>
                              <Badge className={`text-xs px-2 py-1 border ${getRoleBadgeColor(user.role)} capitalize`}>
                                {user.role}
                              </Badge>
                              <Badge className={`text-xs px-2 py-1 border ${getStatusBadgeColor(user.isActive)} capitalize`}>
                                {user.isActive ? 'active' : 'inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Agent Details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <Check className="h-4 w-4" />
                            <span>Login Credentials Set</span>
                          </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between py-4 border-t border-slate-700">
                          <span className="text-white font-medium">Enable/Disable Agent</span>
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => {
                              updateUserStatusMutation.mutate({
                                id: user.id,
                                isActive: checked
                              });
                            }}
                            disabled={updateUserStatusMutation.isPending}
                            data-testid={`switch-agent-status-${user.id}`}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserForm(true);
                            }}
                            data-testid={`button-edit-agent-${user.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                            data-testid={`button-reset-agent-${user.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                        
                        <Button
                          className="w-full mt-3 bg-red-700 hover:bg-red-600 text-white"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete agent "${user.name}"? This action cannot be undone.`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-agent-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Agent
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Add Agent Button - Floating Action */}
            {users.length > 0 && (
              <div className="fixed bottom-8 right-8">
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    setShowUserForm(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-14 w-14 shadow-lg"
                  data-testid="button-add-agent-floating"
                >
                  <UserPlus className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Webhook Configuration</h3>
                <p className="text-slate-400 text-sm sm:text-base">Manage external integrations and notifications</p>
              </div>
              <Button
                onClick={() => {
                  setEditingWebhook(null);
                  setShowWebhookForm(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                data-testid="button-add-webhook"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>

            {webhooksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading webhooks...</p>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No webhooks configured</p>
                <p className="text-slate-500 text-sm">Add your first webhook to start receiving external notifications</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 sm:p-6 bg-slate-800/50 border border-slate-700/30 rounded-lg" data-testid={`webhook-item-${webhook.id}`}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-base">{webhook.name}</h4>
                          <Badge className={`text-xs px-2 py-1 ${webhook.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' : 'bg-slate-500/20 text-slate-400 border-slate-400/30'}`}>
                            {webhook.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 break-all mb-3">{webhook.url}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                          className={`text-xs ${testWebhookMutation.isPending ? 'animate-pulse' : ''}`}
                          data-testid={`button-test-webhook-${webhook.id}`}
                        >
                          <TestTube className="h-3 w-3 sm:mr-1" />
                          <span className="hidden xs:inline">Test</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingWebhook(webhook);
                            setShowWebhookForm(true);
                          }}
                          className="text-xs"
                          data-testid={`button-edit-webhook-${webhook.id}`}
                        >
                          <Edit className="h-3 w-3 sm:mr-1" />
                          <span className="hidden xs:inline">Edit</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this webhook?')) {
                              deleteWebhookMutation.mutate(webhook.id);
                            }
                          }}
                          disabled={deleteWebhookMutation.isPending}
                          className="text-xs"
                          data-testid={`button-delete-webhook-${webhook.id}`}
                        >
                          <Trash2 className="h-3 w-3 sm:mr-1" />
                          <span className="hidden xs:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-white text-lg">{webhook.name}</h4>
                          <Badge className={`text-sm px-3 py-1 ${webhook.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' : 'bg-slate-500/20 text-slate-400 border-slate-400/30'}`}>
                            {webhook.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 truncate pr-4">{webhook.url}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                          className={`${testWebhookMutation.isPending ? 'animate-pulse' : ''}`}
                          data-testid={`button-test-webhook-${webhook.id}`}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testWebhookMutation.isPending ? 'Testing...' : 'Test'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingWebhook(webhook);
                            setShowWebhookForm(true);
                          }}
                          data-testid={`button-edit-webhook-${webhook.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this webhook?')) {
                              deleteWebhookMutation.mutate(webhook.id);
                            }
                          }}
                          disabled={deleteWebhookMutation.isPending}
                          data-testid={`button-delete-webhook-${webhook.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteWebhookMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mcp" && (
          <div className="space-y-6">
            {/* AI Agent Connectivity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">AI Agent Connectivity</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Connected Agents</h4>
                  <div className="text-2xl font-bold text-white mb-1">0</div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">WebSocket URL</h4>
                  <div className="bg-slate-900 p-2 rounded font-mono text-sm text-emerald-400">
                    ws://localhost:5001
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Available Commands</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">create_lead</Badge>
                    <Badge className="bg-green-500/20 text-green-400 text-xs">update_lead</Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 text-xs">get_analytics</Badge>
                    <Badge className="bg-orange-500/20 text-orange-400 text-xs">manage_products</Badge>
                  </div>
                </div>
              </div>
            </div>


            {/* MCP Server Code & Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">MCP Server Code & Configuration</h3>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">Claude Desktop Configuration</h4>
                  <p className="text-slate-400 text-sm mb-4">Add this to your Claude Desktop config file:</p>
                </div>
                
                <div className="relative bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                    <code>{`{
  "mcpServers": {
    "siwaht-crm": {
      "command": "node",
      "args": ["/path/to/mcp-server-siwaht.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`}</code>
                  </pre>
                  <Button
                    onClick={() => {
                      const configText = `{
  "mcpServers": {
    "siwaht-crm": {
      "command": "node",
      "args": ["/path/to/mcp-server-siwaht.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`;
                      navigator.clipboard.writeText(configText);
                      toast({
                        title: "Copied!",
                        description: "Configuration copied to clipboard",
                      });
                    }}
                    className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 text-xs"
                  >
                    Copy Configuration
                  </Button>
                </div>
              </div>
            </div>

            {/* Package.json for MCP Server */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Package.json for MCP Server</h4>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="relative bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                    <code>{`{
  "name": "@siwaht/mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for Siwaht CRM AI Integration",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "keywords": ["mcp", "ai", "crm", "siwaht"],
  "author": "Siwaht Team",
  "license": "MIT"
}`}</code>
                  </pre>
                  <Button
                    onClick={() => {
                      const packageText = `{
  "name": "@siwaht/mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for Siwaht CRM AI Integration",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "keywords": ["mcp", "ai", "crm", "siwaht"],
  "author": "Siwaht Team",
  "license": "MIT"
}`;
                      navigator.clipboard.writeText(packageText);
                      toast({
                        title: "Copied!",
                        description: "Package.json copied to clipboard",
                      });
                    }}
                    className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 text-xs"
                  >
                    Copy Package.json
                  </Button>
                </div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">MCP Server Status</h4>
                  <p className="text-slate-400 text-sm">Model Context Protocol v1.0.0</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">Online</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-slate-400">Port:</p>
                  <p className="text-white">5003</p>
                </div>
                <div>
                  <p className="text-slate-400">Host:</p>
                  <p className="text-white">0.0.0.0</p>
                </div>
                <div>
                  <p className="text-slate-400">Protocol:</p>
                  <p className="text-white">WebSocket</p>
                </div>
                <div>
                  <p className="text-slate-400">Capabilities:</p>
                  <p className="text-white">Logging, Tools, Resources</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Database Management</h3>
            
            {/* Export Section */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">Export Database</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Download a complete backup of your CRM data including users, leads, products, interactions, and configurations.
                  </p>
                  <Button
                    onClick={() => exportDatabaseMutation.mutate()}
                    disabled={exportDatabaseMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid="button-export-database"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportDatabaseMutation.isPending ? "Exporting..." : "Export Database"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Import Section */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">Import Database</h4>
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-400 font-medium">Warning: This will replace all existing data</p>
                      <p className="text-sm text-slate-400">
                        Import will completely replace your current database with the uploaded data. Make sure to export a backup first.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-import-database"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Database
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleDatabaseImport}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Delete Section */}
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">Clear Database</h4>
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Danger: This cannot be undone</p>
                      <p className="text-sm text-slate-400">
                        This will permanently delete ALL data from your CRM including users, leads, products, and configurations. Make sure to export a backup first.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm("Are you absolutely sure? This will delete ALL data from your CRM and cannot be undone. Type 'DELETE' to confirm.")) {
                        const confirmText = prompt("Please type 'DELETE' to confirm:");
                        if (confirmText === "DELETE") {
                          deleteDatabaseMutation.mutate();
                        } else {
                          toast({
                            title: "Cancelled",
                            description: "Database deletion was cancelled",
                          });
                        }
                      }
                    }}
                    disabled={deleteDatabaseMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-database"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteDatabaseMutation.isPending ? "Deleting..." : "Clear All Data"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-3">Database Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Users:</p>
                  <p className="text-white font-medium" data-testid="stat-users">{users.length}</p>
                </div>
                <div>
                  <p className="text-slate-400">Products:</p>
                  <p className="text-white font-medium" data-testid="stat-products">{products.length}</p>
                </div>
                <div>
                  <p className="text-slate-400">Leads:</p>
                  <p className="text-white font-medium" data-testid="stat-leads">{leads.length}</p>
                </div>
                <div>
                  <p className="text-slate-400">Webhooks:</p>
                  <p className="text-white font-medium" data-testid="stat-webhooks">{webhooks.length}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status:</p>
                  <Badge className="bg-emerald-500/20 text-emerald-400" data-testid="stat-status">Online</Badge>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Database Version: 1.0.0 • Last Updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Form Modal */}
      {showWebhookForm && (
        <WebhookForm
          webhook={editingWebhook}
          onClose={() => {
            setShowWebhookForm(false);
            setEditingWebhook(null);
          }}
        />
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}