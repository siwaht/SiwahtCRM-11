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
  TestTube
} from "lucide-react";
import UserForm from "./UserForm";
import WebhookForm from "./WebhookForm";
import type { User, Webhook as WebhookType } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  console.log('AdminPanel rendering...');

  // Users queries and mutations
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users"],
  });

  console.log('Users data:', users);
  console.log('Users loading:', usersLoading);
  console.log('Users error:', usersError);

  // Webhooks queries and mutations
  const { data: webhooks = [], isLoading: webhooksLoading, error: webhooksError } = useQuery({
    queryKey: ["/api/webhooks"],
  });

  console.log('Webhooks data:', webhooks);
  console.log('Webhooks loading:', webhooksLoading);
  console.log('Webhooks error:', webhooksError);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        <p className="text-slate-400 mt-1">System configuration and user management</p>
        
        {/* Debug Info */}
        <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400 text-sm">AdminPanel Debug:</p>
          <p className="text-blue-300 text-xs">Users: {users.length} items, Loading: {usersLoading ? 'yes' : 'no'}</p>
          <p className="text-blue-300 text-xs">Webhooks: {webhooks.length} items, Loading: {webhooksLoading ? 'yes' : 'no'}</p>
          {usersError && <p className="text-red-300 text-xs">Users Error: {String(usersError)}</p>}
          {webhooksError && <p className="text-red-300 text-xs">Webhooks Error: {String(webhooksError)}</p>}
        </div>
      </div>

      {/* Simple Tabs */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-2 ${activeTab === "users" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Users className="h-4 w-4" />
            <span>Users ({users.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center space-x-2 ${activeTab === "webhooks" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Webhook className="h-4 w-4" />
            <span>Webhooks ({webhooks.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center space-x-2 ${activeTab === "mcp" ? "bg-indigo-600" : "bg-slate-700"}`}
          >
            <Bot className="h-4 w-4" />
            <span>AI Integration</span>
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
                {users.map((user: User) => (
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
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
                {webhooks.map((webhook: WebhookType) => (
                  <div key={webhook.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{webhook.name}</p>
                        <p className="text-sm text-slate-400 truncate">{webhook.url}</p>
                        <Badge className="mt-1">{webhook.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">
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
                        <Button size="sm" variant="destructive">
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Integration (MCP)</h3>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-white">WebSocket Server Status: Online</p>
              <p className="text-slate-400 text-sm">Port 5003 • Model Context Protocol</p>
            </div>
          </div>
        )}
      </div>

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