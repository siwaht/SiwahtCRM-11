import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings,
  CheckCircle,
  Clock,
  Circle,
  Paperclip,
  MessageSquare,
  Calendar,
  Target,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Upload,
  Mail,
  Phone,
  AlertTriangle,
  Save,
  FileText,
  X
} from "lucide-react";
import type { Lead, LeadAttachment } from "@shared/schema";

export default function EngineeringDashboard() {
  const [selectedProject, setSelectedProject] = useState<Lead | null>(null);
  const [filter, setFilter] = useState("All Projects");
  const [sortBy, setSortBy] = useState("Priority");
  const [progressUpdate, setProgressUpdate] = useState<number>(0);
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Fetch attachments for selected project
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery<LeadAttachment[]>({
    queryKey: [`/api/leads/${selectedProject?.id}/attachments`],
    enabled: !!selectedProject?.id,
  });

  // Get the actual user ID (handle nested user object)
  const userId = (user as any)?.user?.id || user?.id;
  
  // Filter leads for engineer's projects only
  const engineerProjects = leads.filter((lead: Lead) => {
    return lead.assignedEngineer === userId; // Show all leads assigned to this engineer
  });

  const pendingProjects = engineerProjects.filter(lead => (lead.engineeringProgress || 0) === 0);
  const activeProjects = engineerProjects.filter(lead => (lead.engineeringProgress || 0) > 0 && (lead.engineeringProgress || 0) < 100);
  const completedProjects = engineerProjects.filter(lead => (lead.engineeringProgress || 0) === 100);

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: number; progress: number }) => {
      return await apiRequest("PUT", `/api/leads/${id}`, { engineeringProgress: progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Progress updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest("PUT", `/api/leads/${id}`, { engineeringNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes",
      });
    },
  });

  const handleProgressUpdate = (progress: number) => {
    if (selectedProject) {
      updateProgressMutation.mutate({ id: selectedProject.id, progress });
      setSelectedProject({ ...selectedProject, engineeringProgress: progress });
    }
  };

  const handleQuickProgress = (percentage: number) => {
    if (selectedProject) {
      updateProgressMutation.mutate({ id: selectedProject.id, progress: percentage });
      setSelectedProject({ ...selectedProject, engineeringProgress: percentage });
      setProgressUpdate(percentage);
    }
  };

  const handleSaveNotes = () => {
    if (selectedProject && technicalNotes !== (selectedProject.engineeringNotes || "")) {
      updateNotesMutation.mutate({ id: selectedProject.id, notes: technicalNotes });
      setSelectedProject({ ...selectedProject, engineeringNotes: technicalNotes });
    }
  };

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      const response = await apiRequest("DELETE", `/api/lead-attachments/${attachmentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${selectedProject?.id}/attachments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete file",
      });
    },
  });

  const handleProjectSelect = (project: Lead) => {
    setSelectedProject(project);
    setProgressUpdate(project.engineeringProgress || 0);
    setTechnicalNotes(project.engineeringNotes || "");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-slate-800/30 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Technical Implementation Dashboard for {(user as any)?.user?.name || user?.name || 'Engineer'}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-slate-400">{pendingProjects.length} Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-400">{activeProjects.length} Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-slate-400">{completedProjects.length} Completed</span>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700" data-testid="select-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="All Projects">All Projects</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="Priority">Priority</SelectItem>
                <SelectItem value="Progress">Progress</SelectItem>
                <SelectItem value="Date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Showing {(() => {
            switch (filter) {
              case "Pending": return pendingProjects.length;
              case "Active": return activeProjects.length;
              case "Completed": return completedProjects.length;
              default: return engineerProjects.length;
            }
          })()} of {engineerProjects.length} projects
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Queue */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-white">Project Queue</h3>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto p-1 hover:bg-slate-700/50"
            >
              <Settings className="h-4 w-4 text-slate-400" />
            </Button>
          </div>

          <div className="space-y-3">
            {(() => {
              const getFilteredProjects = () => {
                switch (filter) {
                  case "Pending": return pendingProjects;
                  case "Active": return activeProjects;
                  case "Completed": return completedProjects;
                  default: return engineerProjects;
                }
              };

              const filteredProjects = getFilteredProjects();

              return filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {filter === "All Projects" 
                      ? "No engineering projects assigned yet."
                      : `No ${filter.toLowerCase()} projects.`
                    }
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedProject?.id === project.id
                      ? 'bg-slate-700/50 border-indigo-500/50'
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'
                  }`}
                  onClick={() => handleProjectSelect(project)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">
                          {project.name} - {project.company || 'TechCorp'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs px-2 py-1 border ${getPriorityColor(project.priority || 'medium')}`}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {project.priority || 'Medium'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-slate-400 hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        data-testid={`button-complete-${project.id}`}
                      >
                        Complete
                      </Button>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Progress</span>
                        <span className="text-xs text-slate-400">{project.engineeringProgress || 0}%</span>
                      </div>
                      <Progress 
                        value={project.engineeringProgress || 0} 
                        className="w-full h-2" 
                        data-testid={`progress-${project.id}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>${project.value?.toLocaleString() || '45,000'}</span>
                      <span>2 services</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            );
            })()}
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-white">Select Project</h3>
          </div>

          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Header */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {selectedProject.name} - {selectedProject.company}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{selectedProject.email || 'sarah.johnson@techcorp.com'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{selectedProject.phone || '+1-555-0123'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronLeft className="h-4 w-4 text-slate-400" />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="text-green-400">${selectedProject.value?.toLocaleString() || '45,000'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Services to Implement */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-slate-400" />
                    <h4 className="font-medium text-white">Services to Implement</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">AI Avatar Creation</span>
                      <span className="text-sm text-slate-400">$0.00</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">AI Generated Video Ad</span>
                      <span className="text-sm text-slate-400">$0.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <h4 className="font-medium text-white">Requirements</h4>
                  </div>
                  <p className="text-sm text-slate-300">
                    Client needs AI Avatar and Video Ad creation for their new product launch campaign. 
                    High priority project with tight deadline.
                  </p>
                </CardContent>
              </Card>

              {/* Delivery Progress */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-slate-400" />
                    <h4 className="font-medium text-white">Delivery Progress</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Implementation Progress</span>
                        <span className="text-lg font-semibold text-blue-400">
                          {selectedProject.engineeringProgress || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={selectedProject.engineeringProgress || 0} 
                        className="w-full h-3" 
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Started</span>
                        <span>50% - Milestone</span>
                        <span>Complete</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Update:</span>
                        <span className="text-sm text-blue-400">{progressUpdate}%</span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-6 bg-slate-600 rounded-full relative">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-200"
                            style={{ width: `${progressUpdate}%` }}
                          ></div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progressUpdate}
                            onChange={(e) => setProgressUpdate(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            data-testid="slider-progress"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleProgressUpdate(progressUpdate)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700"
                        data-testid="button-update-progress"
                      >
                        Update Progress
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {[0, 25, 50, 75, 100].map((percentage) => (
                        <Button
                          key={percentage}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickProgress(percentage)}
                          className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white flex-1"
                          data-testid={`button-progress-${percentage}`}
                        >
                          {percentage}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Files */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <h4 className="font-medium text-white">Project Files ({attachments.length})</h4>
                    </div>
                    <label
                      htmlFor="eng-file-upload"
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </label>
                    <input
                      type="file"
                      id="eng-file-upload"
                      multiple
                      accept="*/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0 || !selectedProject) return;
                        
                        setIsUploading(true);
                        const currentDescription = fileDescription.trim();
                        
                        toast({
                          title: "Uploading",
                          description: `Uploading ${files.length} file(s)...`,
                        });
                        
                        try {
                          for (const file of files) {
                            const formData = new FormData();
                            formData.append('file', file);
                            if (currentDescription) {
                              formData.append('description', currentDescription);
                            }
                            
                            const response = await fetch(`/api/leads/${selectedProject.id}/attachments`, {
                              method: 'POST',
                              body: formData,
                              credentials: 'include'
                            });
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              throw new Error(errorData.message || `Failed to upload ${file.name}`);
                            }
                          }
                          
                          queryClient.invalidateQueries({ queryKey: [`/api/leads/${selectedProject.id}/attachments`] });
                          queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
                          
                          setFileDescription("");
                          e.target.value = '';
                          
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
                          e.target.value = '';
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </div>

                  {/* File Description Input */}
                  {attachments.length === 0 && (
                    <Input
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="Optional description for uploaded files..."
                      className="bg-slate-700/30 border-slate-600 text-slate-300 mb-3"
                      disabled={isUploading}
                    />
                  )}

                  {/* Attachments List */}
                  {attachmentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment: LeadAttachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                          <div className="flex items-center gap-2 flex-1">
                            <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 truncate">{attachment.fileName}</p>
                              {attachment.description && (
                                <p className="text-xs text-slate-400 truncate">{attachment.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/attachments/${attachment.id}/download`, '_blank')}
                              className="text-blue-400 hover:text-blue-300 p-1"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                              disabled={deleteAttachmentMutation.isPending}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Input
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder="Optional description for new files..."
                        className="bg-slate-700/30 border-slate-600 text-slate-300 mt-2"
                        disabled={isUploading}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No files attached. Upload technical documents, specifications, or implementation files.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Technical Implementation Notes */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-slate-400" />
                    <h4 className="font-medium text-white">Technical Implementation Notes</h4>
                  </div>
                  <Textarea
                    value={technicalNotes}
                    onChange={(e) => setTechnicalNotes(e.target.value)}
                    placeholder="Working on AI Avatar design - client approved initial concepts. Video ad production starts next week. Need to coordinate with creative team for brand alignment."
                    className="bg-slate-700/30 border-slate-600 min-h-[120px] resize-none text-slate-300"
                    data-testid="textarea-notes"
                  />
                  <Button
                    onClick={handleSaveNotes}
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    disabled={technicalNotes === (selectedProject.engineeringNotes || "")}
                    data-testid="button-save-notes"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <ChevronLeft className="h-6 w-6 text-slate-400" />
                  <ChevronRight className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-400">
                  Select a project from the queue to view technical details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}