import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  AlertTriangle
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
    priority: "all"
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
      
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
      new: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      proposal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      negotiation: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      won: "bg-green-500/20 text-green-400 border-green-500/30",
      lost: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.new;
  };

  const getAssigneeName = (assignedTo: number | null) => {
    if (!assignedTo) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name : "Unknown";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lead Management</h2>
          <p className="text-slate-400 mt-1">{leads.length} of {leads.length} leads</p>
        </div>
        <Button
          onClick={() => {
            setEditingLead(null);
            setShowLeadForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2"
          data-testid="button-add-lead"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              data-testid="input-search"
            />
          </div>
        </div>
        <div className="w-32">
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="select-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-700/30 px-4 py-3 border-b border-slate-600/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-2">Lead</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Products</div>
            <div className="col-span-1">Value</div>
            <div className="col-span-1">Follow-up</div>
            <div className="col-span-1">Assigned</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-700/50">
          {leads.map((lead: Lead) => (
            <div key={lead.id} className="px-4 py-4 hover:bg-slate-700/20 transition-colors" data-testid={`row-lead-${lead.id}`}>
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500" />
                </div>
                
                {/* Lead */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {lead.name} - {lead.company || 'TechCorp'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{lead.source || 'Website'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Contact */}
                <div className="col-span-2">
                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="text-blue-400">{lead.email}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status */}
                <div className="col-span-1">
                  {lead.status === 'won' && (lead.engineeringProgress || 0) > 0 ? (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs px-2 py-1">
                      In Development
                    </Badge>
                  ) : lead.status === 'won' ? (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-xs px-2 py-1">
                      Design Phase
                    </Badge>
                  ) : (
                    <Badge className={`${getStatusBadge(lead.status)} text-xs px-2 py-1 border`}>
                      {lead.status}
                    </Badge>
                  )}
                </div>
                
                {/* Priority */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {lead.priority === 'high' && <AlertTriangle className="h-3 w-3 text-red-400" />}
                    <Badge className={`${getPriorityColor(lead.priority || 'medium')} text-xs px-2 py-1 border`}>
                      {lead.priority === 'high' ? 'Hot' : lead.priority || 'medium'}
                    </Badge>
                  </div>
                </div>
                
                {/* Products */}
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {lead.status === 'won' && (
                      <>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-xs px-2 py-1">
                          AI Avatar Creation
                        </Badge>
                        {(lead.engineeringProgress || 0) > 0 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-xs px-2 py-1">
                            AI Generated Video Ad
                          </Badge>
                        )}
                      </>
                    )}
                    {lead.status !== 'won' && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs px-2 py-1">
                        AI Podcast Production
                      </Badge>
                    )}
                    {!lead.assignedProduct && lead.status === 'new' && (
                      <span className="text-xs text-slate-500">No products</span>
                    )}
                  </div>
                </div>
                
                {/* Value */}
                <div className="col-span-1">
                  <span className="text-sm font-medium text-green-400">
                    $ {lead.value ? lead.value.toLocaleString() : '0'}
                  </span>
                </div>
                
                {/* Follow-up */}
                <div className="col-span-1">
                  <span className="text-xs text-slate-500">Not set</span>
                </div>
                
                {/* Assigned */}
                <div className="col-span-1">
                  <span className="text-xs text-slate-400">{getAssigneeName(lead.assignedTo)}</span>
                </div>
                
                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center justify-start space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(lead)}
                      className="p-1.5 hover:bg-slate-700/50 rounded"
                      data-testid={`button-view-${lead.id}`}
                    >
                      <Eye className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                      className="p-1.5 hover:bg-slate-700/50 rounded"
                      data-testid={`button-edit-${lead.id}`}
                    >
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                      className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"
                      data-testid={`button-delete-${lead.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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