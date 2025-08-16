import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle
} from "lucide-react";
import type { User, Webhook as WebhookType, Product, Lead } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
            <span className="hidden xs:inline">Users</span>
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">User Management</h3>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserForm(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-add-user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {usersLoading ? (
              <p className="text-slate-400">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-slate-400">No users found</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                      <Badge className="mt-1">{user.role}</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserForm(true);
                        }}
                        data-testid={`button-edit-user-${user.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Webhook Configuration</h3>
              <Button
                onClick={() => {
                  setEditingWebhook(null);
                  setShowWebhookForm(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>

            {webhooksLoading ? (
              <p className="text-slate-400">Loading webhooks...</p>
            ) : webhooks.length === 0 ? (
              <p className="text-slate-400">No webhooks configured</p>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{webhook.name}</p>
                        <p className="text-sm text-slate-400 truncate">{webhook.url}</p>
                        <Badge className="mt-1">{webhook.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingWebhook(webhook);
                            setShowWebhookForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
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
                        >
                          <Trash2 className="h-4 w-4" />
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