import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Webhook } from "@shared/schema";
import { X, Plus, Trash2 } from "lucide-react";

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  isActive: z.boolean(),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const availableEvents = [
  { id: "lead.created", label: "Lead Created" },
  { id: "lead.updated", label: "Lead Updated" },
  { id: "lead.deleted", label: "Lead Deleted" },
  { id: "lead.status_changed", label: "Lead Status Changed" },
  { id: "lead.assigned", label: "Lead Assigned" },
  { id: "interaction.created", label: "Interaction Created" },
  { id: "interaction.updated", label: "Interaction Updated" },
  { id: "interaction.deleted", label: "Interaction Deleted" },
  { id: "product.created", label: "Product Created" },
  { id: "product.updated", label: "Product Updated" },
  { id: "product.deleted", label: "Product Deleted" },
  { id: "user.created", label: "User Created" },
  { id: "user.updated", label: "User Updated" },
  { id: "project.created", label: "Project Created" },
  { id: "project.completed", label: "Project Completed" },
];

interface WebhookFormProps {
  webhook?: Webhook | null;
  onClose: () => void;
}

export default function WebhookForm({ webhook, onClose }: WebhookFormProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    webhook?.events || ["lead.created"]
  );
  const [customHeaders, setCustomHeaders] = useState<Array<{key: string, value: string}>>(
    webhook?.headers ? Object.entries(webhook.headers).map(([key, value]) => ({key, value})) : []
  );
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: webhook?.name || "",
      url: webhook?.url || "",
      events: webhook?.events || ["lead.created"],
      isActive: webhook?.isActive ?? true,
      secret: webhook?.secret || "",
      headers: webhook?.headers || {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const response = await apiRequest("POST", "/api/webhooks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create webhook",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const response = await apiRequest("PUT", `/api/webhooks/${webhook!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update webhook",
      });
    },
  });

  const handleEventToggle = (eventId: string) => {
    const newEvents = selectedEvents.includes(eventId)
      ? selectedEvents.filter(e => e !== eventId)
      : [...selectedEvents, eventId];
    
    setSelectedEvents(newEvents);
    form.setValue("events", newEvents);
  };

  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const onSubmit = (data: WebhookFormData) => {
    const headers = customHeaders.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    const formData = { ...data, events: selectedEvents, headers };
    
    if (webhook) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {webhook ? "Edit Webhook" : "Add Webhook"}
          </DialogTitle>
          <Button
            variant="ghost"
            onClick={onClose}
            className="absolute right-4 top-4 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Webhook Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="bg-slate-800 border-slate-600 text-slate-100"
              placeholder="e.g., Lead Notifications"
            />
            {form.formState.errors.name && (
              <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              {...form.register("url")}
              className="bg-slate-800 border-slate-600 text-slate-100"
              placeholder="https://your-app.com/webhooks/crm"
            />
            {form.formState.errors.url && (
              <p className="text-red-400 text-sm">{form.formState.errors.url.message}</p>
            )}
          </div>

          {/* Events */}
          <div className="space-y-3">
            <Label className="text-slate-200 font-medium">Events</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableEvents.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => handleEventToggle(event.id)}
                    className="h-4 w-4 text-purple-600 bg-slate-800 border-slate-600 rounded"
                  />
                  <Label htmlFor={event.id} className="text-sm text-slate-300 cursor-pointer">
                    {event.id}
                  </Label>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-red-400 text-sm">Select at least one event</p>
            )}
          </div>

          {/* Headers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200 font-medium">Headers</Label>
              <Button
                type="button"
                onClick={addHeader}
                size="sm"
                className="bg-slate-700 hover:bg-slate-600 text-slate-200"
                data-testid="button-add-header"
              >
                Add Header
              </Button>
            </div>
            <div className="space-y-2">
              {customHeaders.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100 flex-1"
                    data-testid={`input-header-key-${index}`}
                  />
                  <Input
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100 flex-1"
                    data-testid={`input-header-value-${index}`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeHeader(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    data-testid={`button-remove-header-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Secret */}
          <div className="space-y-2">
            <Label htmlFor="secret" className="text-slate-200 font-medium">Secret (Optional)</Label>
            <Input
              id="secret"
              {...form.register("secret")}
              className="bg-slate-800 border-slate-600 text-slate-100"
              placeholder="Webhook secret for verification"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive" className="text-slate-200 font-medium">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-create-webhook"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : webhook ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}