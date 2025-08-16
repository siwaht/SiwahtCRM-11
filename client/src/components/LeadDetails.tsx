import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Clock
} from "lucide-react";
import type { Lead, Interaction } from "@shared/schema";

interface LeadDetailsProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetails({ lead, onClose }: LeadDetailsProps) {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
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
      default: return <MessageSquare className="h-4 w-4" />;
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {lead.company ? lead.company.charAt(0).toUpperCase() : lead.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {lead.company || lead.name}
          </DialogTitle>
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
          </div>

          {/* Interactions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Interactions</h3>
                  <Button
                    onClick={() => setShowAddInteraction(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Interaction</span>
                  </Button>
                </div>

                {/* Add Interaction Form */}
                {showAddInteraction && (
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700/50">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Text</label>
                        <Textarea
                          value={newInteraction.text}
                          onChange={(e) => setNewInteraction({...newInteraction, text: e.target.value})}
                          placeholder="Enter interaction details..."
                          className="bg-slate-800/50 border-slate-700 min-h-[100px]"
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={handleAddInteraction}
                          disabled={addInteractionMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {addInteractionMutation.isPending ? "Adding..." : "Add Interaction"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddInteraction(false);
                            setNewInteraction({ type: "note", text: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactions List */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                      <p className="text-slate-400 mt-2">Loading interactions...</p>
                    </div>
                  ) : interactions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">No interactions yet</p>
                      <p className="text-sm text-slate-500">Add an interaction to get started</p>
                    </div>
                  ) : (
                    interactions.map((interaction: Interaction) => (
                      <div
                        key={interaction.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center flex-shrink-0">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-slate-600/20 text-slate-300 text-xs">
                                {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
                              </Badge>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {new Date(interaction.createdAt).toLocaleDateString()} at {new Date(interaction.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <p className="text-sm text-slate-200 mb-2">{interaction.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}