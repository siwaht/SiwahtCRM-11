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
  Plus, 
  MessageSquare, 
  Phone, 
  Calendar, 
  FileText,
  Mail,
  User,
  Building,
  DollarSign,
  Clock,
  Search,
  Filter,
  Users,
  AlertTriangle,
  Paperclip,
  History
} from "lucide-react";
import type { Lead, Interaction } from "@shared/schema";

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
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add interaction",
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
      new: "bg-slate-500/20 text-slate-400",
      contacted: "bg-blue-500/20 text-blue-400",
      qualified: "bg-emerald-500/20 text-emerald-400",
      proposal: "bg-amber-500/20 text-amber-400",
      negotiation: "bg-orange-500/20 text-orange-400",
      won: "bg-green-500/20 text-green-400",
      lost: "bg-red-500/20 text-red-400",
    };
    return colors[status as keyof typeof colors] || colors.new;
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
    if (!assignedTo) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name : "Unknown";
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
      interaction.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || interaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {lead.company ? lead.company.charAt(0).toUpperCase() : lead.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {lead.company || lead.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            View and manage lead interactions, notes, and contact information
          </DialogDescription>
          <Button
            variant="ghost"
            onClick={onClose}
            className="absolute right-4 top-4 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Contact</p>
                      <p className="font-medium">{lead.name}</p>
                    </div>
                  </div>

                  {lead.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Company</p>
                        <p className="font-medium">{lead.company}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>

                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <p className="font-medium">{lead.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </div>

                  {lead.value && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Value</p>
                        <p className="font-medium">${lead.value.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Assigned To</p>
                      <p className="font-medium">{getAssigneeName(lead.assignedTo)}</p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Notes</p>
                      <p className="text-sm bg-slate-800/50 rounded-lg p-3">{lead.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Products</h3>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <p className="text-slate-400">No products selected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Interactions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                {/* Interaction History Header */}
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold">Interaction History</h3>
                  <span className="text-sm text-slate-400 ml-auto">
                    {filteredInteractions.length} of {interactions.length} record{interactions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search interactions or team member..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
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

                {/* Enhanced Interactions List */}
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

                {/* Quick Actions */}
                <div className="border-t border-slate-700 pt-6 mb-6">
                  <h4 className="text-white font-medium mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    <Button
                      onClick={() => handleQuickAction('call')}
                      className="flex flex-col items-center justify-center h-16 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400"
                    >
                      <Phone className="h-4 w-4 mb-1" />
                      <span className="text-xs">Call</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('email')}
                      className="flex flex-col items-center justify-center h-16 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400"
                    >
                      <Mail className="h-4 w-4 mb-1" />
                      <span className="text-xs">Email</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('meeting')}
                      className="flex flex-col items-center justify-center h-16 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400"
                    >
                      <Calendar className="h-4 w-4 mb-1" />
                      <span className="text-xs">Meeting</span>
                    </Button>
                    <Button
                      onClick={() => setShowAddInteraction(true)}
                      className="flex flex-col items-center justify-center h-16 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 text-slate-400"
                    >
                      <FileText className="h-4 w-4 mb-1" />
                      <span className="text-xs">Note</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('team')}
                      className="flex flex-col items-center justify-center h-16 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400"
                    >
                      <Users className="h-4 w-4 mb-1" />
                      <span className="text-xs">Team</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickAction('urgent')}
                      className="flex flex-col items-center justify-center h-16 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400"
                    >
                      <AlertTriangle className="h-4 w-4 mb-1" />
                      <span className="text-xs">Urgent</span>
                    </Button>
                  </div>
                </div>

                {/* Add Customer Note */}
                <div className="border-t border-slate-700 pt-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Add Customer Note</h4>
                    <Badge className="bg-slate-600/20 text-slate-300 text-xs">Note</Badge>
                  </div>
                  <div className="space-y-3">
                    <Textarea
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Add a note about this customer..."
                      className="bg-slate-800/50 border-slate-700 min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Press Enter to save, or Shift+Enter for new line
                      </p>
                      <Button
                        onClick={handleQuickNote}
                        disabled={!quickNote.trim() || quickNoteMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6"
                      >
                        {quickNoteMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File Attachments */}
                <div className="border-t border-slate-700 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <h4 className="text-white font-medium">File Attachments</h4>
                  </div>
                  <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                    <div className="text-slate-400">
                      <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Drag files here or click to upload</p>
                      <p className="text-xs mt-1">Supports PDF, images, and documents</p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Add Interaction Form */}
        {showAddInteraction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddInteraction(false)}>
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Add Detailed Interaction</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Type</label>
                    <Select 
                      value={newInteraction.type} 
                      onValueChange={(value) => setNewInteraction({...newInteraction, type: value as any})}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="urgent">Urgent Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Details</label>
                  <Textarea
                    value={newInteraction.text}
                    onChange={(e) => setNewInteraction({...newInteraction, text: e.target.value})}
                    placeholder="Enter interaction details..."
                    className="bg-slate-800/50 border-slate-700 min-h-[120px]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddInteraction(false);
                      setNewInteraction({ type: "note", text: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddInteraction}
                    disabled={addInteractionMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
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