import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<InsertProduct> & { tagsInput?: string }>({
    name: product?.name || "",
    price: product?.price || "",
    pitch: product?.pitch || "",
    talkingPoints: product?.talkingPoints || "",
    agentNotes: product?.agentNotes || "",
    priority: product?.priority || "Medium",
    profitLevel: product?.profitLevel || "Standard",
    tags: product?.tags || [],
    tagsInput: product?.tags?.join(", ") || "",
    displayOrder: product?.displayOrder || 0,
    isActive: product?.isActive ?? true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      if (product) {
        return await apiRequest("PUT", `/api/products/${product.id}`, data);
      } else {
        return await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: product ? "Product updated successfully" : "Product created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${product ? "update" : "create"} product`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove tagsInput from the data sent to the server
    const { tagsInput, ...submitData } = formData;
    mutation.mutate(submitData);
  };

  const handleChange = (field: keyof InsertProduct, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    // Store the raw input value to allow proper editing
    setFormData(prev => ({ 
      ...prev, 
      tagsInput: value,
      tags: value.split(',').map(tag => tag.trim()).filter(Boolean)
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Product Name *</Label>
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
              <Label htmlFor="price" className="text-slate-300">Price *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="e.g., $5,000 - $15,000"
                className="mt-1 bg-slate-800/50 border-slate-700"
                required
                data-testid="input-price"
              />
            </div>

            <div>
              <Label htmlFor="priority" className="text-slate-300">Priority</Label>
              <Select value={formData.priority || ""} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="profitLevel" className="text-slate-300">Profit Level</Label>
              <Select value={formData.profitLevel || ""} onValueChange={(value) => handleChange("profitLevel", value)}>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-profit-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="High Profit">High Profit</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Low Margin">Low Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="pitch" className="text-slate-300">Product Pitch</Label>
            <Textarea
              id="pitch"
              value={formData.pitch || ""}
              onChange={(e) => handleChange("pitch", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={3}
              placeholder="Describe the product and its benefits..."
              data-testid="textarea-pitch"
            />
          </div>

          <div>
            <Label htmlFor="talkingPoints" className="text-slate-300">Talking Points</Label>
            <Textarea
              id="talkingPoints"
              value={formData.talkingPoints || ""}
              onChange={(e) => handleChange("talkingPoints", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={3}
              placeholder="Key points for sales conversations..."
              data-testid="textarea-talking-points"
            />
          </div>

          <div>
            <Label htmlFor="agentNotes" className="text-slate-300">Agent Notes</Label>
            <Textarea
              id="agentNotes"
              value={formData.agentNotes || ""}
              onChange={(e) => handleChange("agentNotes", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              rows={3}
              placeholder="Internal notes for sales agents..."
              data-testid="textarea-agent-notes"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-slate-300">Tags</Label>
            <Input
              id="tags"
              value={formData.tagsInput || ""}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              placeholder="AI, Automation, Chatbot (comma separated)"
              data-testid="input-tags"
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
              {mutation.isPending ? "Saving..." : (product ? "Update Product" : "Create Product")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}