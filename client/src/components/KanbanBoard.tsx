import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MoreVertical, Paperclip, MessageSquare, Calendar, File, CheckCircle, Phone } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import type { Lead } from "@shared/schema";
import LeadDetails from "./LeadDetails";

const statusConfig = {
  new: { label: "New", color: "bg-slate-500", count: 0 },
  contacted: { label: "Contacted", color: "bg-blue-500", count: 0 },
  qualified: { label: "Qualified", color: "bg-emerald-500", count: 0 },
  proposal: { label: "Proposal", color: "bg-amber-500", count: 0 },
  negotiation: { label: "Negotiation", color: "bg-orange-500", count: 0 },
  won: { label: "Won", color: "bg-green-500", count: 0 },
  lost: { label: "Lost", color: "bg-red-500", count: 0 },
};

export default function KanbanBoard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/leads/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead status updated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lead status",
      });
    },
  });

  const groupedLeads = leads.reduce((acc: Record<string, Lead[]>, lead: Lead) => {
    if (!acc[lead.status]) {
      acc[lead.status] = [];
    }
    acc[lead.status].push(lead);
    return acc;
  }, {});

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const leadId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    updateLeadMutation.mutate({ id: leadId, status: newStatus });
  };

  const getAssigneeName = (assignedTo: number | null) => {
    if (!assignedTo) return "Unassigned";
    const user = users.find((u: any) => u.id === assignedTo);
    return user ? user.name.split(" ").map((n: string) => n[0]).join("") + "." : "Unknown";
  };

  const getAssigneeColor = (assignedTo: number | null) => {
    if (!assignedTo) return "bg-slate-500";
    const colors = ["bg-indigo-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500"];
    return colors[assignedTo % colors.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="flex space-x-3 sm:space-x-6 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72 sm:w-80 h-80 sm:h-96 bg-slate-800/30 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Sales Pipeline</h2>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Visual pipeline management with drag & drop</p>
        </div>
        <Button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-3 sm:space-x-6 overflow-x-auto pb-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusLeads = groupedLeads[status] || [];
            
            return (
              <div key={status} className="flex-shrink-0 w-72 sm:w-80">
                <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 h-fit">
                  <CardContent className="p-3 sm:p-4 overflow-hidden">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${config.color} rounded-full`}></div>
                        <h3 className="font-semibold">{config.label}</h3>
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                          {statusLeads.length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[400px] ${
                            snapshot.isDraggingOver ? "bg-slate-700/20 rounded-lg" : ""
                          }`}
                        >
                          {statusLeads.map((lead, index) => (
                            <Draggable
                              key={lead.id}
                              draggableId={lead.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 sm:p-4 cursor-move hover:border-indigo-500/50 transition-colors ${
                                    snapshot.isDragging ? "shadow-xl rotate-3" : ""
                                  }`}
                                  data-testid={`card-lead-${lead.id}`}
                                  onDoubleClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                  }}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between mb-2 gap-2">
                                    <h4 className="font-medium text-xs sm:text-sm line-clamp-1 flex-1 min-w-0 break-words">{lead.company || lead.name}</h4>
                                    <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                                      {lead.value ? `$${lead.value.toLocaleString()}` : "—"}
                                    </span>
                                  </div>

                                  {/* Card Content */}
                                  <p className="text-xs text-slate-400 mb-2 sm:mb-3 line-clamp-2 break-words overflow-hidden">
                                    {lead.notes || "No description available"}
                                  </p>

                                  {/* Card Footer */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <div className={`w-5 h-5 sm:w-6 sm:h-6 ${getAssigneeColor(lead.assignedTo)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white text-xs font-medium truncate px-1">
                                          {getAssigneeName(lead.assignedTo)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex space-x-1 flex-shrink-0">
                                      {status === "contacted" && <Phone className="h-3 w-3 text-green-500" />}
                                      {status === "qualified" && <Calendar className="h-3 w-3 text-amber-500" />}
                                      {status === "proposal" && <File className="h-3 w-3 text-amber-500" />}
                                      {status === "won" && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                                      <Paperclip className="h-3 w-3 text-slate-500" />
                                      <MessageSquare className="h-3 w-3 text-slate-500" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      
      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
        />
      )}
    </div>
  );
}
