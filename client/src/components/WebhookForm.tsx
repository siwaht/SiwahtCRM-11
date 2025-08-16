import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Webhook, InsertWebhook } from "@shared/schema";

interface WebhookFormProps {
  webhook?: Webhook | null;
  onClose: () => void;
}

const availableEvents = [
  "lead.created",
  "lead.updated", 
  "lead.status_changed",
  "interaction.created",
  "*"
];

export default function WebhookForm({ webhook, onClose }: WebhookFormProps) {
  const [formData, setFormData] = useState<Partial<InsertWebhook>>({
    name: webhook?.name || "",
    url: webhook?.url || "",
    events: webhook?.events || [],
    headers: webhook?.headers || {},
    secret: webhook?.secret || "",
    isActive: webhook?.isActive ?? true,
  });

  const [headersText, setHeadersText] = useState(
    webhook?.headers ? JSON.stringify(webhook.headers, null, 2) : ""
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertWebhook>) => {
      if (webhook) {
        return await apiRequest("PUT", `/api/webhooks/${webhook.id}`, data);
      } else {
        return await apiRequest("POST", "/api/webhooks", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: webhook ? "Webhook updated successfully" : "Webhook created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${webhook ? "update" : "create"} webhook`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse headers JSON
    let headers = {};
    if (headersText.trim()) {
      try {
        headers = JSON.parse(headersText);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid JSON format in headers",
        });
        return;
      }
    }

    mutation.mutate({
      ...formData,
      headers,
    });
  };

  const handleChange = (field: keyof InsertWebhook, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventToggle = (event: string, checked: boolean) => {
    const currentEvents = formData.events || [];
    if (checked) {
      handleChange("events", [...currentEvents, event]);
    } else {
      handleChange("events", currentEvents.filter(e => e !== event));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {webhook ? "Edit Webhook" : "Add New Webhook"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Webhook Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                required
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="url" className="text-slate-300">Webhook URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange("url", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                placeholder="https://your-app.com/webhooks"
                required
                data-testid="input-url"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Events to Subscribe</Label>
            <div className="mt-2 space-y-2">
              {availableEvents.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={formData.events?.includes(event) || false}
                    onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                    data-testid={`checkbox-event-${event}`}
                  />
                  <Label htmlFor={event} className="text-slate-300 text-sm">
                    {event}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="secret" className="text-slate-300">Secret (for HMAC verification)</Label>
            <Input
              id="secret"
              value={formData.secret || ""}
              onChange={(e) => handleChange("secret", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              placeholder="Optional: webhook signature secret"
              data-testid="input-secret"
            />
          </div>

          <div>
            <Label htmlFor="headers" className="text-slate-300">Custom Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={4}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              data-testid="textarea-headers"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              data-testid="checkbox-active"
            />
            <Label htmlFor="isActive" className="text-slate-300">
              Active Webhook
            </Label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              data-testid="button-save"
            >
              {mutation.isPending ? "Saving..." : (webhook ? "Update Webhook" : "Create Webhook")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}