import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  X, 
  MessageSquare, 
  Phone, 
  Calendar, 
  FileText,
  Mail,
  Users,
  AlertTriangle,
  History,
  Search,
  Package
} from "lucide-react";
import type { Lead, Interaction, Product } from "@shared/schema";
import LeadLinkManager from "./LeadLinkManager";

interface LeadDetailsProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetails({ lead, onClose }: LeadDetailsProps) {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [quickNote, setQuickNote] = useState("");

  const [newInteraction, setNewInteraction] = useState({
    type: "note" as const,
    text: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interactions = [], isLoading } = useQuery<Interaction[]>({
    queryKey: [`/api/leads/${lead.id}/interactions`],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/me"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data: typeof newInteraction) => {
      return await apiRequest("POST", `/api/leads/${lead.id}/interactions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/interactions`] });
      setNewInteraction({ type: "note", text: "" });
      setShowAddInteraction(false);
      toast({
        title: "Success",
        description: "Interaction added successfully",
      });
    },
    onError: (error) => {
      console.error('Add interaction error:', error);
      toast({
        title: "Error",
        description: "Failed to add interaction",
        variant: "destructive",
      });
    },
  });

  const quickNoteMutation = useMutation({
    mutationFn: async (data: { type: string; text: string }) => {
      return await apiRequest("POST", `/api/leads/${lead.id}/interactions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/interactions`] });
      setQuickNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error) => {
      console.error('Quick note error:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const assignedAgent = users.find(u => u.id === lead.assignedTo);
  const assignedEngineer = users.find(u => u.id === lead.assignedEngineer);

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    quickNoteMutation.mutate({
      type: "note",
      text: quickNote.trim()
    });
  };

  const handleAddInteraction = () => {
    if (!newInteraction.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter interaction details",
        variant: "destructive",
      });
      return;
    }
    addInteractionMutation.mutate(newInteraction);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickNote();
    }
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = searchQuery === "" || 
      interaction.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || interaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'meeting': return <Calendar className="h-3 w-3" />;
      case 'note': return <FileText className="h-3 w-3" />;
      case 'team': return <Users className="h-3 w-3" />;
      case 'urgent': return <AlertTriangle className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'email': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'meeting': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'note': return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
      case 'team': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
    }
  };

  const priorityColor = {
    low: 'bg-green-500/20 text-green-400 border-green-400/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    high: 'bg-red-500/20 text-red-400 border-red-400/30'
  }[lead.priority] || 'bg-slate-500/20 text-slate-400 border-slate-400/30';

  const statusColor = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    qualified: 'bg-green-500/20 text-green-400 border-green-400/30',
    proposal: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    negotiation: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
    won: 'bg-green-600/20 text-green-400 border-green-400/30',
    lost: 'bg-red-500/20 text-red-400 border-red-400/30'
  }[lead.status] || 'bg-slate-500/20 text-slate-400 border-slate-400/30';

  const interestedProducts = Array.isArray(lead.interestedProductNames) 
    ? lead.interestedProductNames 
    : [];

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700 overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                {lead.name}
                <Badge className={priorityColor}>
                  {lead.priority}
                </Badge>
                <Badge className={statusColor}>
                  {lead.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {lead.company && `${lead.company} • `}{lead.email} • {lead.phone}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              data-testid="button-close-lead-details"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column - Lead Info & Quick Actions */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Contact Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span>{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-4 w-4" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.company && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-slate-500">Company:</span>
                      <span>{lead.company}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Deal Info</h4>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="text-slate-500">Value:</span>
                  <span className="font-medium text-green-400">${lead.value?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              {/* Assignment Info */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Assignment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-500">Agent:</span>
                    <span>{assignedAgent?.username || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-500">Engineer:</span>
                    <span>{assignedEngineer?.username || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Follow Up Date */}
              {lead.followUpDate && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Follow Up</h4>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(lead.followUpDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Notes</h4>
                  <p className="text-sm text-slate-400 bg-slate-800/50 rounded p-3 border border-slate-700">
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Note */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <Badge className="bg-slate-600/20 text-slate-300 text-xs border border-slate-500/30">Note</Badge>
                </div>
                <div className="space-y-3">
                  <Textarea
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Add a note about this customer..."
                    className="bg-slate-800/50 border-slate-700 min-h-[80px] resize-none"
                    data-testid="textarea-quick-note"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Press Enter to save, or Shift+Enter for new line
                    </p>
                    <Button
                      onClick={handleQuickNote}
                      disabled={!quickNote.trim() || quickNoteMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 px-6"
                      data-testid="button-save-note"
                    >
                      {quickNoteMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Links Manager */}
            <LeadLinkManager leadId={lead.id} />
          </div>

          {/* Right Column - Interactions History */}
          <div className="lg:col-span-2 space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Interaction History</h3>
                <Badge className="bg-slate-600/20 text-slate-300 text-xs border border-slate-500/30">
                  {filteredInteractions.length}
                </Badge>
              </div>
              <Button
                onClick={() => setShowAddInteraction(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-add-interaction"
              >
                Add Interaction
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700"
                  data-testid="input-search-interactions"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="call">Calls</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interactions List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredInteractions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchQuery || typeFilter !== "all" ? (
                    <p>No interactions match your search criteria.</p>
                  ) : (
                    <p>No interactions yet. Add the first interaction to get started!</p>
                  )}
                </div>
              ) : (
                filteredInteractions.map((interaction) => {
                  const user = users.find(u => u.id === interaction.userId);
                  return (
                    <div 
                      key={interaction.id} 
                      className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4"
                      data-testid={`interaction-${interaction.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getInteractionColor(interaction.type)} text-xs`}>
                            {getInteractionIcon(interaction.type)}
                            <span className="ml-1 capitalize">{interaction.type}</span>
                          </Badge>
                          <span className="text-xs text-slate-500">
                            by {user?.username || 'Unknown User'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(interaction.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {interaction.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Add Interaction Modal */}
        {showAddInteraction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddInteraction(false)}>
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Add Detailed Interaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Type</label>
                  <Select 
                    value={newInteraction.type} 
                    onValueChange={(value) => setNewInteraction({...newInteraction, type: value as any})}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="urgent">Urgent Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Details</label>
                  <Textarea
                    value={newInteraction.text}
                    onChange={(e) => setNewInteraction({...newInteraction, text: e.target.value})}
                    placeholder="Enter interaction details..."
                    className="bg-slate-800/50 border-slate-700 min-h-[120px]"
                    data-testid="textarea-new-interaction"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddInteraction(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="button-cancel-interaction"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddInteraction}
                    disabled={addInteractionMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    data-testid="button-save-interaction"
                  >
                    {addInteractionMutation.isPending ? "Adding..." : "Add Interaction"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}