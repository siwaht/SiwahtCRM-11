import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { 
  SiDropbox, 
  SiGoogledrive, 
  SiYoutube, 
  SiInstagram, 
  SiTiktok, 
  SiFacebook, 
  SiLinkedin, 
  SiX 
} from "react-icons/si";

interface LeadLink {
  id: number;
  leadId: number;
  url: string;
  title: string;
  description?: string;
  platform: string;
  addedById?: number;
  createdAt: string;
}

interface LeadLinkManagerProps {
  leadId: number;
}

const platformIcons = {
  dropbox: SiDropbox,
  googledrive: SiGoogledrive,
  youtube: SiYoutube,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  linkedin: SiLinkedin,
  twitter: SiX,
  website: LinkIcon,
  other: LinkIcon,
};

const platformLabels = {
  dropbox: "Dropbox",
  googledrive: "Google Drive",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  website: "Website",
  other: "Other",
};

const platformColors = {
  dropbox: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  googledrive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  youtube: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  tiktok: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  linkedin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  twitter: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  website: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function LeadLinkManager({ leadId }: LeadLinkManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    platform: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery<LeadLink[]>({
    queryKey: [`/api/leads/${leadId}/links`],
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", `/api/leads/${leadId}/links`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/links`] });
      setFormData({ url: "", title: "", description: "", platform: "" });
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Link added successfully",
      });
    },
    onError: (error) => {
      console.error('Add link error:', error);
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await apiRequest("DELETE", `/api/lead-links/${linkId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/links`] });
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete link error:', error);
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim() || !formData.title.trim() || !formData.platform) {
      toast({
        title: "Error",
        description: "URL, title, and platform are required",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.url);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    addLinkMutation.mutate(formData);
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons] || LinkIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            External Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading links...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            External Links ({links.length})
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            data-testid="button-add-link"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">URL *</label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  data-testid="input-link-url"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Platform *</label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger data-testid="select-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(value)}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Link title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-link-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-link-description"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={addLinkMutation.isPending}
                data-testid="button-save-link"
              >
                {addLinkMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                data-testid="button-cancel-link"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {links.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No external links added yet.</p>
            <p className="text-sm">Add links to Dropbox, Google Drive, YouTube, social media, and more.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                data-testid={`link-item-${link.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={platformColors[link.platform as keyof typeof platformColors]}
                    >
                      {getPlatformIcon(link.platform)}
                      <span className="ml-1">{platformLabels[link.platform as keyof typeof platformLabels]}</span>
                    </Badge>
                  </div>
                  <h4 className="font-medium truncate">{link.title}</h4>
                  {link.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{link.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                      data-testid={`link-open-${link.id}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Link
                    </a>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteLinkMutation.mutate(link.id)}
                  disabled={deleteLinkMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                  data-testid={`button-delete-link-${link.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}