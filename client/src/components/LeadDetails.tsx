import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  Package,
  Link,
  Star,
  Settings,
  Save
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
  const [engineeringNotes, setEngineeringNotes] = useState(lead.engineeringNotes || "");
  const [engineeringProgress, setEngineeringProgress] = useState(lead.engineeringProgress || 0);

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

  const saveEngineeringNotesMutation = useMutation({
    mutationFn: async (data: { engineeringNotes: string; engineeringProgress: number }) => {
      return await apiRequest("PUT", `/api/leads/${lead.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Engineering notes saved successfully",
      });
    },
    onError: (error) => {
      console.error('Save engineering notes error:', error);
      toast({
        title: "Error",
        description: "Failed to save engineering notes",
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

  const handleSaveEngineeringNotes = () => {
    saveEngineeringNotesMutation.mutate({
      engineeringNotes,
      engineeringProgress
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickNote();
    }
  };

  const handleQuickAction = (type: string) => {
    setNewInteraction({ type: type as any, text: "" });
    setShowAddInteraction(true);
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
  }[lead.priority as keyof typeof priorityColor] || 'bg-slate-500/20 text-slate-400 border-slate-400/30';

  const statusColor = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    qualified: 'bg-green-500/20 text-green-400 border-green-400/30',
    proposal: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    negotiation: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
    won: 'bg-green-600/20 text-green-400 border-green-400/30',
    lost: 'bg-red-500/20 text-red-400 border-red-400/30'
  }[lead.status as keyof typeof statusColor] || 'bg-slate-500/20 text-slate-400 border-slate-400/30';



  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700 overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                {lead.name} - {lead.company}
                <Badge className={priorityColor}>
                  {lead.priority}
                </Badge>
                <Badge className={statusColor}>
                  {lead.status}
                </Badge>
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </div>
              </div>
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

        <div className="flex-1 overflow-hidden p-6 space-y-6">
          {/* Status and Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Status:</div>
              <Badge className={statusColor}>{lead.status}</Badge>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Priority:</div>
              <Badge className={priorityColor}>{lead.priority}</Badge>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Score:</div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-semibold">{lead.score}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Source:</div>
              <span className="text-white">{lead.source || 'Website'}</span>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Deal Value:</div>
              <span className="text-green-400 font-semibold">${lead.value?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Assigned Agent:</div>
              <span className="text-white">{assignedAgent?.username || 'Unassigned'}</span>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Assigned Engineer:</div>
              <span className="text-white">{assignedEngineer?.username || 'Unassigned'}</span>
            </div>
          </div>

          {/* Engineering Progress Section */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Delivery Progress</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Implementation Progress</span>
                  <span className="text-blue-400 font-semibold">{engineeringProgress}%</span>
                </div>
                <Progress value={engineeringProgress} className="h-2" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Started</span>
                <span className="text-slate-400 text-sm">50% - Milestone</span>
                <span className="text-slate-400 text-sm">Complete</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-slate-300 mr-2">Update:</span>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <Button
                      key={value}
                      variant={engineeringProgress === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEngineeringProgress(value)}
                      className="px-3 py-1 text-xs"
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleSaveEngineeringNotes}
                  disabled={saveEngineeringNotesMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  Update Progress
                </Button>
              </div>
            </div>
          </div>

          {/* Technical Implementation Notes */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Technical Implementation Notes</h3>
            </div>
            
            <Textarea
              value={engineeringNotes}
              onChange={(e) => setEngineeringNotes(e.target.value)}
              placeholder="Working on AI Avatar design - client approved initial concepts. Video ad production starts next week. Need to coordinate with creative team for brand alignment."
              className="bg-slate-800/50 border-slate-700 min-h-[120px] mb-4"
            />
            
            <Button
              onClick={handleSaveEngineeringNotes}
              disabled={saveEngineeringNotesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveEngineeringNotesMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </div>



          {/* Notes Section */}
          {lead.notes && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
              <p className="text-slate-300">{lead.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <Button
                onClick={() => handleQuickAction('call')}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-blue-500/30 hover:bg-blue-500/10"
              >
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-blue-400">Call</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('email')}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-green-500/30 hover:bg-green-500/10"
              >
                <Mail className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400">Email</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('meeting')}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-purple-500/30 hover:bg-purple-500/10"
              >
                <Calendar className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-purple-400">Meeting</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('note')}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-slate-500/30 hover:bg-slate-500/10"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">Note</span>
              </Button>
              <Button
                onClick={() => setNewInteraction({type: 'note', text: 'Added external link: '})}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Link className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-cyan-400">Link</span>
              </Button>
              <Button
                onClick={() => handleQuickAction('urgent')}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-1 p-3 h-auto border-red-500/30 hover:bg-red-500/10"
              >
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-red-400">Urgent</span>
              </Button>
            </div>
          </div>

          {/* Add Customer Note */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Add Customer Note</h3>
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
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-save-note"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {quickNoteMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
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