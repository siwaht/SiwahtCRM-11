import { useState, useEffect } from "react";
import * as React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Calendar } from "lucide-react";
import type { Lead, InsertLead, Product } from "@shared/schema";

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
    notes: lead?.notes || "",
    priority: lead?.priority || "medium",
    tags: lead?.tags || [],
    followUpDate: lead?.followUpDate ? lead?.followUpDate.toISOString().split('T')[0] : "",
  });
  
  const [selectedProducts, setSelectedProducts] = useState<number[]>(
    leadWithProducts?.products?.map(p => p.id) || []
  );
  
  // Update selected products when leadWithProducts changes
  React.useEffect(() => {
    if (leadWithProducts?.products) {
      setSelectedProducts(leadWithProducts.products.map(p => p.id));
    }
  }, [leadWithProducts]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Load existing lead products when editing
  const { data: leadWithProducts } = useQuery<Lead & { products: Product[] }>({
    queryKey: ["/api/leads", lead?.id, "with-products"],
    enabled: !!lead?.id,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertLead> & { productIds: number[] }) => {
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
    const submitData = {
      ...formData,
      productIds: selectedProducts,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : null,
      tags: formData.tags || []
    };
    mutation.mutate(submitData);
  };
  
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };
  
  const handleProductToggle = (productId: number, checked: boolean) => {
    setSelectedProducts(prev => {
      if (checked) {
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  };

  const handleChange = (field: keyof InsertLead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
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
                <SelectContent className="bg-slate-800 border-slate-700">
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
                <SelectContent className="bg-slate-800 border-slate-700">
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
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags" className="text-slate-300">Tags</Label>
              <Input
                id="tags"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="e.g., urgent, follow-up, hot-lead"
                className="mt-1 bg-slate-800/50 border-slate-700"
                data-testid="input-tags"
              />
              <p className="text-xs text-slate-400 mt-1">Separate tags with commas</p>
            </div>

            <div>
              <Label htmlFor="followUpDate" className="text-slate-300">Follow-up Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate || ""}
                  onChange={(e) => handleChange("followUpDate", e.target.value)}
                  className="mt-1 bg-slate-800/50 border-slate-700 pl-10"
                  data-testid="input-follow-up-date"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full">
            <Label className="text-slate-300 mb-3 block">Interested Products</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              {products.length === 0 ? (
                <p className="text-slate-400 text-sm col-span-full">No products available</p>
              ) : (
                products.map((product: Product) => (
                  <div key={product.id} className="flex items-start space-x-3 p-2 hover:bg-slate-800/50 rounded">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                      data-testid={`checkbox-product-${product.id}`}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="text-sm font-medium text-slate-200 cursor-pointer"
                      >
                        {product.name}
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">{product.price}</p>
                      {product.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          product.priority === 'High' ? 'bg-red-900/50 text-red-300' :
                          product.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {product.priority} Priority
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={4}
              placeholder="Any additional notes about this lead..."
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
