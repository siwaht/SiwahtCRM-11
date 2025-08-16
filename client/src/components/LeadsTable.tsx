import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  ArrowUpDown,
  Settings
} from "lucide-react";
import LeadForm from "./LeadForm";
import LeadDetails from "./LeadDetails";
import type { Lead } from "@shared/schema";

export default function LeadsTable() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    assignedTo: "all",
    source: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", filters],
    queryFn: async () => {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.assignedTo && filters.assignedTo !== 'all') params.set('assignedTo', filters.assignedTo);
      if (filters.source) params.set('source', filters.source);
      
      const url = `/api/leads${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      
      return response.json();
    },
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete lead",
      });
    },
  });

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  const handleView = (lead: Lead) => {
    setViewingLead(lead);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      new: "bg-slate-500/20 text-slate-400",
      contacted: "bg-blue-500/20 text-blue-400",
      qualified: "bg-emerald-500/20 text-emerald-400",
      proposal: "bg-amber-500/20 text-amber-400",
      negotiation: "bg-orange-500/20 text-orange-400",
      won: "bg-green-500/20 text-green-400",
      lost: "bg-red-500/20 text-red-400",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.new}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAssigneeName = (assignedTo: number | null) => {
    if (!assignedTo) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name.split(" ").map((n: string) => n[0]).join("") + "." : "Unknown";
  };

  const getEngineerName = (assignedEngineer: number | null) => {
    if (!assignedEngineer) return "—";
    const user = users.find((u: any) => u.id === assignedEngineer);
    return user ? user.name.split(" ").map((n: string) => n[0]).join("") + "." : "Unknown";
  };

  const applyFilters = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-slate-800/30 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Lead Management</h2>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage and track all your leads</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <div className="flex space-x-2 sm:space-x-3">
            <Button variant="outline" className="flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial" data-testid="button-export">
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Export</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial" data-testid="button-import">
              <Upload className="h-4 w-4" />
              <span className="hidden xs:inline">Import</span>
            </Button>
          </div>
          <Button
            onClick={() => {
              setEditingLead(null);
              setShowLeadForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            data-testid="button-add-lead"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search leads..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-slate-800/50 border-slate-700"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Assigned To</label>
              <Select value={filters.assignedTo} onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700" data-testid="select-assignee">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Agents</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={applyFilters}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-apply-filters"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>Lead</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>Value</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Engineering Progress</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Last Contact</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {leads.map((lead: Lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors" data-testid={`row-lead-${lead.id}`}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-xs sm:text-sm">
                          {lead.company ? lead.company.charAt(0).toUpperCase() : lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{lead.company || lead.name}</p>
                        <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className="text-xs sm:text-sm font-medium">
                      {lead.value ? `$${lead.value.toLocaleString()}` : "—"}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm truncate">{getAssigneeName(lead.assignedTo)}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                    {lead.assignedEngineer && lead.status === 'won' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{getEngineerName(lead.assignedEngineer)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={lead.engineeringProgress || 0} 
                            className="w-16 h-2" 
                            data-testid={`progress-${lead.id}`}
                          />
                          <span className="text-xs font-medium text-blue-400 min-w-[2rem]">
                            {lead.engineeringProgress || 0}%
                          </span>
                        </div>
                      </div>
                    ) : lead.status === 'won' ? (
                      <div className="text-xs text-slate-500">
                        No engineer assigned
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">—</div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-400">
                      {lead.lastContactedAt 
                        ? new Date(lead.lastContactedAt).toLocaleDateString()
                        : "Never"
                      }
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(lead)}
                        className="p-1 sm:p-2 hover:bg-slate-700/50 rounded-lg"
                        data-testid={`button-view-${lead.id}`}
                      >
                        <Eye className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lead)}
                        className="p-1 sm:p-2 hover:bg-slate-700/50 rounded-lg"
                        data-testid={`button-edit-${lead.id}`}
                      >
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lead.id)}
                        className="p-1 sm:p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                        data-testid={`button-delete-${lead.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing 1 to {leads.length} of {leads.length} results
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <LeadForm
          lead={editingLead}
          onClose={() => {
            setShowLeadForm(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Lead Details Modal */}
      {viewingLead && (
        <LeadDetails
          lead={viewingLead}
          onClose={() => setViewingLead(null)}
        />
      )}
    </div>
  );
}
