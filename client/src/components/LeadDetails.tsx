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
  Paperclip,
  History,
  Search,
  Star,
  Package,
  Upload
} from "lucide-react";
import type { Lead, Interaction, Product } from "@shared/schema";

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
    onError: async (error) => {
      console.error('Add interaction error:', error);
      let errorMessage = "Failed to add interaction";
      
      try {
        // Try to get more specific error message from response
        if (error instanceof Error && error.message.includes('fetch')) {
          const response = await fetch(`/api/leads/${lead.id}/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newInteraction)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        }
      } catch (e) {
        console.error('Error getting specific error message:', e);
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });

  const quickNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      return await apiRequest("POST", `/api/leads/${lead.id}/interactions`, {
        type: "note",
        text: noteText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/interactions`] });
      setQuickNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    }
  });

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      proposal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      negotiation: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      won: "bg-green-500/20 text-green-400 border-green-500/30",
      lost: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      high: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      case "urgent": return <AlertTriangle className="h-4 w-4" />;
      case "team": return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case "call": return "border-l-blue-500 bg-blue-500/5";
      case "email": return "border-l-green-500 bg-green-500/5";
      case "meeting": return "border-l-purple-500 bg-purple-500/5";
      case "urgent": return "border-l-red-500 bg-red-500/5";
      case "team": return "border-l-orange-500 bg-orange-500/5";
      default: return "border-l-slate-500 bg-slate-500/5";
    }
  };

  const getInteractionIconBg = (type: string) => {
    switch (type) {
      case "call": return "bg-blue-500";
      case "email": return "bg-green-500";
      case "meeting": return "bg-purple-500";
      case "urgent": return "bg-red-500";
      case "team": return "bg-orange-500";
      default: return "bg-slate-500";
    }
  };

  const getAssigneeName = (assignedTo: number | null) => {
    if (!assignedTo) return "Admin User";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name : "Admin User";
  };

  const handleAddInteraction = () => {
    if (!newInteraction.text.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Text is required",
      });
      return;
    }
    addInteractionMutation.mutate(newInteraction);
  };

  const handleQuickAction = (type: string) => {
    const actionTexts = {
      call: "Initiated phone call",
      email: "Sent email",
      meeting: "Scheduled meeting",
      note: "Added note",
      team: "Team discussion",
      urgent: "Marked as urgent"
    };
    
    addInteractionMutation.mutate({
      type: type as any,
      text: actionTexts[type as keyof typeof actionTexts] || "Interaction logged"
    });
  };

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    quickNoteMutation.mutate(quickNote);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickNote();
    }
  };

  // Filter interactions based on search and type
  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = !searchQuery || 
      interaction.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAssigneeName(interaction.userId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || interaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-left">
            {lead.company || lead.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage lead interactions, notes, and contact information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">Email:</span>
              <span className="text-blue-400">{lead.email}</span>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-auto text-blue-400 hover:bg-blue-500/10"
              >
                <Mail className="h-3 w-3" />
              </Button>
            </div>
            
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Phone:</span>
                <span className="text-green-400">{lead.phone}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-auto text-green-400 hover:bg-green-500/10"
                >
                  📞
                </Button>
              </div>
            )}
          </div>

          {/* Status Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Status:</span>
              <Badge className={`${getStatusColor(lead.status)} border text-xs`}>
                {lead.status}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Priority:</span>
              <Badge className={`${getPriorityColor(lead.priority || 'medium')} border text-xs`}>
                {lead.priority || 'medium'}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Score:</span>
              <div className="flex items-center gap-1">
                <span className="text-blue-400 font-medium">{lead.score || 35}</span>
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Deal Value:</span>
              <span className="text-slate-300 font-medium">${lead.value?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Source:</span>
              <span className="text-slate-300">{lead.source || 'Website'}</span>
            </div>
          </div>

          {/* Product Interest */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-white">Product Interest</h3>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <p className="text-slate-400">No products selected</p>
              </div>
            </CardContent>
          </Card>

          {/* Interaction History */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-white">Interaction History</h3>
                <span className="text-xs text-slate-400 ml-auto">
                  {filteredInteractions.length} of {interactions.length} record{interactions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search interactions or team member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700"
                    data-testid="input-search-interactions"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700" data-testid="select-interaction-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interactions List */}
              <div className="space-y-3 mb-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading interactions...</p>
                  </div>
                ) : filteredInteractions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400">{searchQuery || typeFilter !== "all" ? "No matching interactions" : "No interactions yet"}</p>
                    <p className="text-sm text-slate-500">Add an interaction to get started</p>
                  </div>
                ) : (
                  filteredInteractions.map((interaction: Interaction) => (
                    <div
                      key={interaction.id}
                      className={`rounded-lg p-4 border-l-4 ${getInteractionColor(interaction.type)} hover:bg-slate-700/20 transition-colors`}
                      data-testid={`interaction-${interaction.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${getInteractionIconBg(interaction.type)} rounded-full flex items-center justify-center flex-shrink-0 text-white`}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-white font-medium capitalize mb-1">
                                {interaction.type === 'urgent' ? 'Urgent Alert' : interaction.type}
                              </h4>
                              <p className="text-xs text-slate-400">
                                by {getAssigneeName(interaction.userId)}
                              </p>
                            </div>
                            <div className="text-xs text-slate-400 text-right">
                              <div>{new Date(interaction.createdAt).toLocaleDateString()}</div>
                              <div>{new Date(interaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-200">{interaction.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-white font-medium">Quick Actions</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <Button
                onClick={() => handleQuickAction('call')}
                className="flex flex-col items-center justify-center h-16 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400"
                data-testid="button-quick-call"
              >
                <Phone className="h-4 w-4 mb-1" />
                <span className="text-xs">Call</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('email')}
                className="flex flex-col items-center justify-center h-16 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400"
                data-testid="button-quick-email"
              >
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('meeting')}
                className="flex flex-col items-center justify-center h-16 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400"
                data-testid="button-quick-meeting"
              >
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">Meeting</span>
              </Button>
              <Button
                onClick={() => setShowAddInteraction(true)}
                className="flex flex-col items-center justify-center h-16 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 text-slate-400"
                data-testid="button-quick-note"
              >
                <FileText className="h-4 w-4 mb-1" />
                <span className="text-xs">Note</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('team')}
                className="flex flex-col items-center justify-center h-16 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400"
                data-testid="button-quick-team"
              >
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Team</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('urgent')}
                className="flex flex-col items-center justify-center h-16 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400"
                data-testid="button-quick-urgent"
              >
                <AlertTriangle className="h-4 w-4 mb-1" />
                <span className="text-xs">Urgent</span>
              </Button>
            </div>
          </div>

          {/* Add Customer Note */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Add Customer Note</h4>
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

          {/* File Attachments */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <h4 className="text-white font-medium">File Attachments</h4>
              </div>
              
              <div className="space-y-4">
                <div className="text-center text-slate-400">
                  <p className="text-sm">No attachments yet.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Optional description for the files..."
                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                    data-testid="input-file-description"
                  />
                  <Button 
                    className="bg-green-600 hover:bg-green-700 px-6"
                    data-testid="button-upload-files"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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