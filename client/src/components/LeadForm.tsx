import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";
import type { Lead, InsertLead } from "@shared/schema";

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
}

export default function LeadForm({ lead, onClose }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<InsertLead>>({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    company: lead?.company || "",
    status: lead?.status || "new",
    source: lead?.source || "",
    value: lead?.value || undefined,
    assignedTo: lead?.assignedTo || undefined,
    assignedProduct: lead?.assignedProduct || undefined,
    notes: lead?.notes || "",
    priority: lead?.priority || "medium",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertLead>) => {
      if (lead) {
        return await apiRequest("PUT", `/api/leads/${lead.id}`, data);
      } else {
        return await apiRequest("POST", "/api/leads", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: lead ? "Lead updated successfully" : "Lead created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${lead ? "update" : "create"} lead`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof InsertLead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Name *</Label>
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
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-slate-300">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-phone"
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-slate-300">Company</Label>
              <Input
                id="company"
                value={formData.company || ""}
                onChange={(e) => handleChange("company", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-company"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source" className="text-slate-300">Source</Label>
              <Input
                id="source"
                value={formData.source || ""}
                onChange={(e) => handleChange("source", e.target.value)}
                placeholder="e.g., Website, Referral, Cold Call"
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-source"
              />
            </div>

            <div>
              <Label htmlFor="value" className="text-slate-300">Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value || ""}
                onChange={(e) => handleChange("value", parseFloat(e.target.value) || undefined)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-value"
              />
            </div>

            <div>
              <Label htmlFor="priority" className="text-slate-300">Priority</Label>
              <Select value={formData.priority || ''} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo" className="text-slate-300">Assigned To</Label>
              <Select 
                value={formData.assignedTo?.toString() || ""} 
                onValueChange={(value) => handleChange("assignedTo", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-assigned-to">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedProduct" className="text-slate-300">Product</Label>
              <Select 
                value={formData.assignedProduct?.toString() || ""} 
                onValueChange={(value) => handleChange("assignedProduct", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No product</SelectItem>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={3}
              data-testid="textarea-notes"
            />
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
              {mutation.isPending ? "Saving..." : (lead ? "Update Lead" : "Create Lead")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
