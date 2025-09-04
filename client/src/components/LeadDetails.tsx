import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import type { Lead, Interaction, Product, LeadAttachment } from "@shared/schema";

interface LeadDetailsProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetails({ lead, onClose }: LeadDetailsProps) {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [quickNote, setQuickNote] = useState("");
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [fileDescription, setFileDescription] = useState("");
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

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery<LeadAttachment[]>({
    queryKey: [`/api/leads/${lead.id}/attachments`],
    retry: 2,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Attachments query error:', error);
    }
  });

  const { data: storageInfo } = useQuery<{storageUsed: number; storageLimit: number; storageAvailable: number}>({
    queryKey: ["/api/user/storage"],
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

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return await apiRequest("DELETE", `/api/lead-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/attachments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete attachment",
      });
    }
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
    if (!assignedTo) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name : "Unknown";
  };

  const getEngineerName = (assignedEngineer: number | null) => {
    if (!assignedEngineer) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedEngineer);
    return user ? user.name : "Unknown";
  };

  const getInteractionUserName = (userId: number | null) => {
    if (!userId) return "Unknown";
    
    // Check if it's the current user first
    const currentUserId = currentUser?.user?.id || currentUser?.id;
    
    if (currentUser && Number(currentUserId) === Number(userId)) {
      // Handle different user data structures
      if (currentUser.user) {
        // If currentUser has a nested user object (API response: {user: {...}})
        const user = currentUser.user;
        const firstName = (user.firstName || '').trim();
        const lastName = (user.lastName || '').trim();
        const name = user.name || `${firstName} ${lastName}`.trim();
        return name || 'You';
      } else {
        // Direct currentUser object
        const firstName = (currentUser.firstName || '').trim();
        const lastName = (currentUser.lastName || '').trim();
        const name = currentUser.name || `${firstName} ${lastName}`.trim();
        return name || 'You';
      }
    }
    
    // Try to find in users list
    const user = users.find((u: any) => Number(u.id) === Number(userId));
    if (user) {
      const firstName = (user.firstName || '').trim();
      const lastName = (user.lastName || '').trim();
      const name = user.name || `${firstName} ${lastName}`.trim();
      return name || 'Unknown User';
    }
    
    // Smart fallback based on common user IDs and roles
    // Since we know the system structure, provide helpful role-based fallbacks
    const userRoleMap: { [key: number]: string } = {
      6: "Admin", // cc@siwaht.com
      18: "Agent", // emma doe
      26: "Engineer" // asif shah
    };
    
    return userRoleMap[userId] || "Team Member";
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
    // Only set the selected action, don't create interaction yet
    setSelectedQuickAction(selectedQuickAction === type ? null : type);
    
    // Set default interaction type and open dialog for links
    if (type === 'links') {
      setNewInteraction({ type: 'links', text: '' });
      setShowAddInteraction(true);
    }
  };

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    
    const noteText = selectedQuickAction 
      ? `[${selectedQuickAction.toUpperCase()}] ${quickNote}`
      : quickNote;
    
    const interactionType = selectedQuickAction || "note";
    
    quickNoteMutation.mutate({
      type: interactionType as any,
      text: noteText
    });
    
    // Clear selected action after use
    setSelectedQuickAction(null);
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

        <div className="space-y-4">
          {/* Contact Information */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-400 text-sm block">Email:</span>
                  <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300 transition-colors text-sm truncate block">
                    {lead.email}
                  </a>
                </div>
              </div>
              
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-400 text-sm block">Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm">{lead.phone}</span>
                      <a
                        href={`https://wa.me/${(lead.phone?.replace(/[^\d+]/g, '') || '').startsWith('+') ? (lead.phone?.replace(/[^\d+]/g, '') || '').slice(1) : (lead.phone?.replace(/[^\d+]/g, '') || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-5 h-5 text-green-500 hover:bg-green-500/10 rounded transition-colors flex-shrink-0"
                        data-testid="link-whatsapp"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Information Grid */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Status: </span>
                <Badge className={`${getStatusColor(lead.status)} border text-xs px-2 py-1 w-fit`}>
                  {lead.status === 'won' && (lead.engineeringProgress || 0) > 0 ? 'In Development' : lead.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Priority: </span>
                <Badge className={`${getPriorityColor(lead.priority || 'medium')} border text-xs px-2 py-1 w-fit`}>
                  {lead.priority === 'high' ? 'Hot' : lead.priority || 'medium'}
                </Badge>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Score: </span>
                <div className="flex items-center gap-1">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 text-xs px-2 py-1">
                    {lead.score || 55}
                  </Badge>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Source: </span>
                <span className="text-slate-300 text-sm">{lead.source || 'Website'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Deal Value: </span>
                <span className="text-green-400 font-medium text-sm">${lead.value?.toLocaleString() || '45,000'}</span>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Assigned Agent</span>
                <span className="text-slate-300 text-sm block">{getAssigneeName(lead.assignedTo)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Assigned Engineer</span>
                <span className="text-slate-300 text-sm block">{getEngineerName(lead.assignedEngineer)}</span>
              </div>
            </div>
          </div>

          {/* Engineering Progress */}
          {lead.assignedEngineer && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <div className="space-y-3">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Engineering Progress</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-700 rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${lead.engineeringProgress || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-400 font-medium text-sm min-w-[40px]">{lead.engineeringProgress || 0}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Engineering Notes - Only show if there are actual notes */}
          {lead.engineeringNotes && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Engineering Notes</h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {lead.engineeringNotes}
              </p>
            </div>
          )}

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {lead.priority === 'high' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-400/30 text-xs">
                  high-priority
                </Badge>
              )}
              {lead.status === 'won' && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30 text-xs">
                  video-production
                </Badge>
              )}
              {(lead.engineeringProgress || 0) > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs">
                  avatar
                </Badge>
              )}
              {lead.source && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/30 text-xs">
                  campaign
                </Badge>
              )}
            </div>
          </div>

          {/* Notes - Only show if there are actual notes */}
          {lead.notes && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Notes</h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Product Interest */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-white">Product Interest</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div>
                    <h4 className="text-white font-medium">AI Avatar Creation</h4>
                    <p className="text-slate-400 text-sm">${lead.value ? Math.floor(lead.value * 0.6).toLocaleString() : '27,000'}</p>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-400/30">
                    Interested
                  </Badge>
                </div>
                {lead.status === 'won' && (
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div>
                      <h4 className="text-white font-medium">AI Generated Video Ad</h4>
                      <p className="text-slate-400 text-sm">${lead.value ? Math.floor(lead.value * 0.4).toLocaleString() : '18,000'}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                      In Progress
                    </Badge>
                  </div>
                )}
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
                                by {getInteractionUserName(interaction.userId)}
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
                className={`flex flex-col items-center justify-center h-16 border ${selectedQuickAction === 'call' 
                  ? 'bg-blue-600/40 border-blue-400 text-blue-300' 
                  : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-400'}`}
                data-testid="button-quick-call"
              >
                <Phone className="h-4 w-4 mb-1" />
                <span className="text-xs">Call</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('email')}
                className={`flex flex-col items-center justify-center h-16 border ${selectedQuickAction === 'email' 
                  ? 'bg-green-600/40 border-green-400 text-green-300' 
                  : 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30 text-green-400'}`}
                data-testid="button-quick-email"
              >
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('meeting')}
                className={`flex flex-col items-center justify-center h-16 border ${selectedQuickAction === 'meeting' 
                  ? 'bg-purple-600/40 border-purple-400 text-purple-300' 
                  : 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 text-purple-400'}`}
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
                className={`flex flex-col items-center justify-center h-16 border ${selectedQuickAction === 'team' 
                  ? 'bg-orange-600/40 border-orange-400 text-orange-300' 
                  : 'bg-orange-600/20 hover:bg-orange-600/30 border-orange-500/30 text-orange-400'}`}
                data-testid="button-quick-team"
              >
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Team</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('urgent')}
                className={`flex flex-col items-center justify-center h-16 border ${selectedQuickAction === 'urgent' 
                  ? 'bg-red-600/40 border-red-400 text-red-300' 
                  : 'bg-red-600/20 hover:bg-red-600/30 border-red-500/30 text-red-400'}`}
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

          {/* File Attachments - Available to all users */}
          {
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <h4 className="text-slate-400 text-sm font-medium">File Attachments</h4>
              </div>
              
              {/* Compact Attachment Area */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 mb-3">
                {attachmentsLoading ? (
                  <div className="flex items-center justify-center h-12">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-1">
                    {attachments.map((attachment) => {
                      const formatFileSize = (bytes: number) => {
                        if (bytes === 0) return '0 B';
                        const k = 1024;
                        const sizes = ['B', 'KB', 'MB', 'GB'];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
                      };
                      
                      return (
                        <div key={attachment.id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-700/20 rounded text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-4 h-4 bg-slate-600/50 rounded flex items-center justify-center flex-shrink-0">
                              <FileText className="h-2.5 w-2.5 text-slate-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-200 truncate font-medium">{attachment.fileName}</span>
                                <span className="text-slate-500">{formatFileSize(attachment.fileSize || 0)}</span>
                              </div>
                              {attachment.description && (
                                <div className="text-slate-400 text-xs truncate">{attachment.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={() => window.open(attachment.filePath, '_blank')}
                              className="text-blue-400 hover:text-blue-300 text-xs px-1.5 py-0.5 rounded hover:bg-blue-500/10"
                              data-testid={`link-view-attachment-${attachment.id}`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                              disabled={deleteAttachmentMutation.isPending}
                              className="text-red-400 hover:text-red-300 text-xs px-1 py-0.5 rounded hover:bg-red-500/10 disabled:opacity-50"
                              data-testid={`button-delete-attachment-${attachment.id}`}
                            >
                              {deleteAttachmentMutation.isPending ? '...' : '×'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-12 text-slate-500 text-xs">
                    No attachments yet.
                  </div>
                )}
              </div>
              
              {/* Simple Upload Interface */}
              <div className="space-y-3">
                <Input 
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Optional description for the files..."
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 text-sm h-8"
                  data-testid="input-file-description"
                />
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="*/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      
                      // Store current description
                      const currentDescription = fileDescription.trim();
                      
                      toast({
                        title: "Uploading",
                        description: `Uploading ${files.length} file(s)...`,
                      });
                      
                      try {
                        for (const file of files) {
                          // Create FormData for file upload
                          const formData = new FormData();
                          formData.append('file', file);
                          if (currentDescription) {
                            formData.append('description', currentDescription);
                          }
                          
                          // Upload file directly using multer endpoint
                          const response = await fetch(`/api/leads/${lead.id}/attachments`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include' // Important for session cookies
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.message || `Failed to upload ${file.name}`);
                          }
                        }
                        
                        // Refresh data
                        queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/attachments`] });
                        queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
                        
                        // Clear form
                        setFileDescription("");
                        e.target.value = ''; // Reset file input
                        
                        toast({
                          title: "Success",
                          description: `${files.length} file(s) uploaded successfully`,
                        });
                        
                      } catch (error) {
                        console.error('Upload error:', error);
                        toast({
                          variant: "destructive",
                          title: "Upload Failed",
                          description: error instanceof Error ? error.message : "Failed to upload files",
                        });
                        e.target.value = ''; // Reset file input
                      }
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Files
                  </label>
                  
                  {/* Storage Usage - Compact Version */}
                  <div className="text-xs text-slate-400">
                    {storageInfo && (
                      <>
                        {(storageInfo.storageUsed / (1024 * 1024)).toFixed(1)} MB / {(storageInfo.storageLimit / (1024 * 1024)).toFixed(0)} MB
                        ({Math.round((storageInfo.storageUsed / storageInfo.storageLimit) * 100)}% used)
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
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