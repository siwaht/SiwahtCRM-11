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
  AlertTriangle,
  Download,
  Upload
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

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
      
      const url = `/api/leads/export/csv${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to export leads');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: "Leads exported successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export leads",
      });
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('csvFile', file);
    
    fetch('/api/leads/import/csv', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    .then(async (response) => {
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to import leads');
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      toast({
        title: "Import Complete",
        description: `${result.results.successful} leads imported successfully. ${result.results.failed} failed.`,
      });
      
      if (result.results.errors.length > 0) {
        console.log('Import errors:', result.results.errors);
      }
    })
    .catch((error) => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import leads",
      });
    })
    .finally(() => {
      // Reset the file input
      event.target.value = '';
    });
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Lead Management</h2>
          <p className="text-slate-400 mt-1">{leads.length} of {leads.length} leads</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Add Lead Button - Priority on mobile */}
          <Button
            onClick={() => {
              setEditingLead(null);
              setShowLeadForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 order-first sm:order-last"
            data-testid="button-add-lead"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          
          <div className="flex gap-2">
            {/* Export CSV Button */}
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 px-3 sm:px-4 py-2 text-sm flex-1 sm:flex-none"
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            
            {/* Import CSV Button */}
            <label className="cursor-pointer flex-1 sm:flex-none">
              <div className="inline-flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-600 text-slate-300 hover:bg-slate-700/50 px-3 sm:px-4 py-2 h-10">
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                data-testid="input-csv-file"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 order-1 sm:order-none">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
              data-testid="input-search"
            />
          </div>
        </div>
        <div className="flex gap-2 sm:gap-0 order-2 sm:order-none">
          <div className="flex-1 sm:w-32">
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
          <div className="flex-1 sm:w-32 sm:ml-4">
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
      </div>

      {/* Desktop Table / Mobile Cards */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden lg:block bg-slate-700/30 px-4 py-3 border-b border-slate-600/50">
          <div className="grid grid-cols-12 gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-2">Lead</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Products</div>
            <div className="col-span-1">Value</div>
            <div className="col-span-1">Follow-up</div>
            <div className="col-span-1">Assigned</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Responsive Content */}
        <div className="divide-y divide-slate-700/50">
          {leads.map((lead: Lead) => (
            <div key={lead.id} className="p-4 hover:bg-slate-700/20 transition-colors" data-testid={`row-lead-${lead.id}`}>
              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-4">
                {/* Lead Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium">
                      {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{lead.name}</h3>
                    <p className="text-sm text-slate-400 truncate">{lead.company || lead.source || 'Website'}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(lead)}
                      className="p-2 hover:bg-slate-700/50 rounded"
                      data-testid={`button-view-${lead.id}`}
                    >
                      <Eye className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                      className="p-2 hover:bg-slate-700/50 rounded"
                      data-testid={`button-edit-${lead.id}`}
                    >
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded"
                      data-testid={`button-delete-${lead.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-blue-400 text-sm">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300 text-sm">{lead.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status and Priority Row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {lead.status === 'won' && (lead.engineeringProgress || 0) > 0 ? (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-sm px-3 py-1">
                        In Development
                      </Badge>
                    ) : lead.status === 'won' ? (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-sm px-3 py-1">
                        Design Phase
                      </Badge>
                    ) : (
                      <Badge className={`${getStatusBadge(lead.status)} text-sm px-3 py-1 border`}>
                        {lead.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.priority === 'high' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    <Badge className={`${getPriorityColor(lead.priority || 'medium')} text-sm px-3 py-1 border`}>
                      {lead.priority === 'high' ? 'Hot' : lead.priority || 'medium'}
                    </Badge>
                  </div>
                </div>

                {/* Value and Product Row */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">
                    <span className="text-slate-400">Value: </span>
                    <span className="text-green-400 font-semibold">
                      ${lead.value ? lead.value.toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="text-sm">
                    {lead.status === 'won' && (lead.engineeringProgress || 0) > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-sm px-2 py-1">
                        Video Ad
                      </Badge>
                    )}
                    {lead.status === 'won' && (lead.engineeringProgress || 0) === 0 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-sm px-2 py-1">
                        AI Avatar
                      </Badge>
                    )}
                    {lead.status !== 'won' && lead.assignedProduct && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-sm px-2 py-1">
                        Podcast
                      </Badge>
                    )}
                    {!lead.assignedProduct && (
                      <span className="text-sm text-slate-500">No Product</span>
                    )}
                  </div>
                </div>

                {/* Assigned To */}
                <div className="text-sm text-slate-400 pt-2 border-t border-slate-700/50">
                  <span className="text-slate-500">Assigned to: </span>
                  <span>{getAssigneeName(lead.assignedTo)}</span>
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:grid grid-cols-12 gap-1 items-center">
                {/* Desktop: Checkbox */}
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500" />
                </div>
                
                {/* Desktop: Lead */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{lead.company || lead.source || 'Website'}</p>
                    </div>
                  </div>
                </div>

                {/* Desktop: Contact */}
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
                <div className="col-span-1">
                  <div className="truncate">
                    {lead.status === 'won' && (lead.engineeringProgress || 0) > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-xs px-1 py-0.5">
                        Video Ad
                      </Badge>
                    )}
                    {lead.status === 'won' && (lead.engineeringProgress || 0) === 0 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-xs px-1 py-0.5">
                        AI Avatar
                      </Badge>
                    )}
                    {lead.status !== 'won' && lead.assignedProduct && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs px-1 py-0.5">
                        Podcast
                      </Badge>
                    )}
                    {!lead.assignedProduct && (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </div>
                </div>
                
                {/* Value */}
                <div className="col-span-1">
                  <span className="text-sm font-medium text-green-400 truncate block">
                    ${lead.value ? lead.value.toLocaleString() : '0'}
                  </span>
                </div>
                
                {/* Follow-up */}
                <div className="col-span-1">
                  <span className="text-xs text-slate-500 truncate block">Not set</span>
                </div>
                
                {/* Assigned */}
                <div className="col-span-1">
                  <span className="text-xs text-slate-400 truncate block">{getAssigneeName(lead.assignedTo)}</span>
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