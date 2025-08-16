import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings,
  CheckCircle,
  Clock,
  Circle,
  Paperclip,
  MessageSquare,
  Calendar,
  Target
} from "lucide-react";
import type { Lead } from "@shared/schema";

const statusIcons = {
  completed: CheckCircle,
  "in-progress": Clock,
  pending: Circle,
};

const priorityColors = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-slate-400",
};

export default function EngineeringDashboard() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["/api/leads", { status: "won" }],
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Lead> }) => {
      return await apiRequest("PUT", `/api/leads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project",
      });
    },
  });

  // Filter leads based on role and selected filter
  const filteredLeads = leads.filter((lead: Lead) => {
    // Engineers only see their assigned projects
    if (user?.role === "engineer" && lead.assignedEngineer !== user.id) {
      return false;
    }
    
    // Apply filter
    switch (selectedFilter) {
      case "in-progress":
        return lead.engineeringProgress > 0 && lead.engineeringProgress < 100;
      case "completed":
        return lead.engineeringProgress === 100;
      default:
        return true;
    }
  });

  const handleProgressUpdate = (leadId: number, progress: number) => {
    updateLeadMutation.mutate({
      id: leadId,
      updates: { engineeringProgress: progress }
    });
  };

  const handleNotesUpdate = (leadId: number, notes: string) => {
    updateLeadMutation.mutate({
      id: leadId,
      updates: { engineeringNotes: notes }
    });
  };

  const getProjectStatus = (progress: number) => {
    if (progress === 100) return "completed";
    if (progress > 0) return "in-progress";
    return "pending";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800/30 rounded-xl mb-6"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Engineering Dashboard</h2>
          <p className="text-slate-400 mt-1">Project tracking and technical progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700" data-testid="select-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-6">
        {filteredLeads.map((lead: Lead) => {
          const projectStatus = getProjectStatus(lead.engineeringProgress);
          const StatusIcon = statusIcons[projectStatus as keyof typeof statusIcons];
          
          return (
            <Card
              key={lead.id}
              className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50"
              data-testid={`card-project-${lead.id}`}
            >
              <CardContent className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" data-testid={`text-project-title-${lead.id}`}>
                        {lead.company || lead.name} - AI Project
                      </h3>
                      <p className="text-sm text-slate-400">
                        Assigned {new Date(lead.createdAt).toLocaleDateString()} • 
                        {lead.value ? ` $${lead.value.toLocaleString()} project` : " Value TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <StatusIcon className={`h-4 w-4 ${
                        projectStatus === "completed" ? "text-emerald-400" :
                        projectStatus === "in-progress" ? "text-amber-400" : "text-slate-400"
                      }`} />
                      <Badge 
                        className={
                          projectStatus === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                          projectStatus === "in-progress" ? "bg-amber-500/20 text-amber-400" :
                          "bg-slate-500/20 text-slate-400"
                        }
                      >
                        {lead.status === "won" ? "Won" : lead.status}
                      </Badge>
                    </div>
                    <p className={`text-xs ${priorityColors[lead.priority as keyof typeof priorityColors]}`}>
                      Priority: {lead.priority}
                    </p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Engineering Progress</span>
                    <span className="text-sm text-slate-400" data-testid={`text-progress-${lead.id}`}>
                      {lead.engineeringProgress}%
                    </span>
                  </div>
                  <Progress 
                    value={lead.engineeringProgress} 
                    className="w-full h-2"
                    data-testid={`progress-bar-${lead.id}`}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(lead.id, Math.min(100, lead.engineeringProgress + 25))}
                      disabled={lead.engineeringProgress >= 100}
                      data-testid={`button-update-progress-${lead.id}`}
                    >
                      +25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(lead.id, 100)}
                      disabled={lead.engineeringProgress >= 100}
                      data-testid={`button-complete-${lead.id}`}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Requirements/Checklist */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Project Requirements</h4>
                    <div className="space-y-2">
                      {/* Sample requirements - in real app this would come from project data */}
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-slate-300">Initial setup and configuration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-slate-300">Core functionality implementation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-slate-300">Integration testing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Circle className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-300">Deployment and handoff</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Notes */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Technical Notes</h4>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                      <Textarea
                        className="w-full bg-transparent resize-none text-sm text-slate-300 placeholder-slate-500 border-0 focus:ring-0"
                        rows={4}
                        placeholder="Add technical notes, challenges, or updates..."
                        value={lead.engineeringNotes || ""}
                        onChange={(e) => handleNotesUpdate(lead.id, e.target.value)}
                        data-testid={`textarea-notes-${lead.id}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/30">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300"
                      data-testid={`button-files-${lead.id}`}
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>View Files</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-300"
                      data-testid={`button-communication-${lead.id}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Client Communication</span>
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600"
                      data-testid={`button-schedule-review-${lead.id}`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Review
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      data-testid={`button-update-status-${lead.id}`}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Projects Found</h3>
            <p className="text-slate-400">
              {selectedFilter === "all" 
                ? "No engineering projects have been assigned yet."
                : `No projects match the "${selectedFilter}" filter.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
