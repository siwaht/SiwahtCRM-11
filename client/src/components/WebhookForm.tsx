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
import { X } from "lucide-react";

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  isActive: z.boolean(),
  secret: z.string().optional(),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const availableEvents = [
  { id: "lead.created", label: "Lead Created" },
  { id: "lead.updated", label: "Lead Updated" },
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

  const onSubmit = (data: WebhookFormData) => {
    const formData = { ...data, events: selectedEvents };
    
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
            <Label>Events to Subscribe</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-2 p-3 bg-slate-800 rounded-lg"
                >
                  <input
                    type="checkbox"
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onChange={() => handleEventToggle(event.id)}
                    className="rounded border-slate-600"
                  />
                  <Label htmlFor={event.id} className="text-sm">
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-red-400 text-sm">Select at least one event</p>
            )}
          </div>

          {/* Secret */}
          <div className="space-y-2">
            <Label htmlFor="secret">Secret Key (Optional)</Label>
            <Input
              id="secret"
              {...form.register("secret")}
              className="bg-slate-800 border-slate-600 text-slate-100"
              placeholder="Optional secret for webhook signature verification"
            />
            <p className="text-xs text-slate-400">
              Used for HMAC signature verification to ensure webhook authenticity
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : webhook ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}