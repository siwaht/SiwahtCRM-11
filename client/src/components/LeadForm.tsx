import { useState, useEffect } from "react";
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
import { X, Calendar, Upload } from "lucide-react";
import type { Lead, InsertLead, Product } from "@shared/schema";

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
}

export default function LeadForm({ lead, onClose }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Omit<InsertLead, 'followUpDate'>> & { followUpDate?: string }>({
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
  
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [fileDescription, setFileDescription] = useState("");

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
  
  // Update selected products when leadWithProducts changes
  useEffect(() => {
    if (leadWithProducts?.products) {
      setSelectedProducts(leadWithProducts.products.map(p => p.id));
    }
  }, [leadWithProducts]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First create or update the lead
      const submitData = {
        ...formData,
        productIds: selectedProducts,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
        tags: formData.tags || [],
        // Ensure value is within valid range or null
        value: formData.value && formData.value <= 8388607 ? formData.value : undefined
      };
      
      const result: any = await (lead ? 
        apiRequest("PUT", `/api/leads/${lead.id}`, submitData) :
        apiRequest("POST", "/api/leads", submitData)
      );
      
      const leadId = result?.id || lead?.id;
      
      // Then upload files if any are selected and we have a lead ID
      if (selectedFiles && selectedFiles.length > 0 && leadId) {
        for (const file of Array.from(selectedFiles)) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          fileFormData.append('description', fileDescription || file.name);
          
          // Use the existing lead attachments endpoint
          await fetch(`/api/leads/${leadId}/attachments`, {
            method: 'POST',
            body: fileFormData,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: lead ? "Lead updated successfully" : "Lead created successfully",
      });
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${lead ? "update" : "create"} lead`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof (Omit<InsertLead, 'followUpDate'> & { followUpDate?: string }), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-lg">
            {lead ? "Edit Lead" : "Create a new lead record"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First row: Name, Email, Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300 text-sm">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter full name"
                className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-300 text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-slate-300 text-sm">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                data-testid="input-phone"
              />
            </div>
          </div>

          {/* Second row: Status, Priority, Source */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status" className="text-slate-300 text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-slate-100" data-testid="select-status">
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
              <Label htmlFor="priority" className="text-slate-300 text-sm">Priority</Label>
              <Select value={formData.priority || ''} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-slate-100" data-testid="select-priority">
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
              <Label htmlFor="source" className="text-slate-300 text-sm">Source</Label>
              <Select value={formData.source || ""} onValueChange={(value) => handleChange("source", value)}>
                <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-slate-100" data-testid="select-source">
                  <SelectValue placeholder="Website" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interested Products Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <Label className="text-slate-300 text-sm font-medium">Interested Products</Label>
            </div>
            <p className="text-slate-400 text-sm">Select all products the lead is interested in:</p>
            
            <div className="min-h-[120px] p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
              {products.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No products available. Create products in the Products tab first.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product: Product) => (
                    <div key={product.id} className="flex items-start space-x-3 p-3 hover:bg-slate-600/30 rounded">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`product-${product.id}`}
                          className="text-sm font-medium text-slate-200 cursor-pointer block"
                        >
                          {product.name}
                        </Label>
                        <p className="text-xs text-slate-400 mt-1">{product.price}</p>
                        {product.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            product.priority === 'High' ? 'bg-red-900/50 text-red-300' :
                            product.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-green-900/50 text-green-300'
                          }`}>
                            {product.priority} Priority
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deal Value and Follow-up Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value" className="text-slate-300 text-sm">Deal Value ($)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  // Limit to valid range for PostgreSQL real type
                  handleChange("value", (!isNaN(val) && val <= 8388607) ? val : undefined);
                }}
                placeholder="0.00"
                className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                data-testid="input-value"
              />
            </div>

            <div>
              <Label htmlFor="followUpDate" className="text-slate-300 text-sm">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate || ""}
                onChange={(e) => handleChange("followUpDate", e.target.value)}
                placeholder="dd-mm-yyyy"
                className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                data-testid="input-follow-up-date"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-slate-300 text-sm">Tags</Label>
            <Input
              id="tags"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="comma, separated, tags"
              className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              data-testid="input-tags"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-slate-300 text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="mt-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 resize-none"
              rows={4}
              placeholder="Additional notes about the lead..."
              data-testid="textarea-notes"
            />
          </div>

          {/* Attach Files Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-slate-400" />
              <Label className="text-slate-300 text-sm font-medium">Attach Files (Optional)</Label>
            </div>
            <div className="flex space-x-3">
              <Input
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Optional description for the files..."
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 px-6"
                  data-testid="button-choose-files"
                >
                  Choose Files
                </Button>
              </div>
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-3 p-3 bg-slate-600/30 rounded border border-slate-600">
                <p className="text-slate-300 text-sm font-medium mb-2">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:
                </p>
                <ul className="space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <li key={index} className="text-slate-400 text-sm flex items-center justify-between">
                      <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const dt = new DataTransfer();
                          Array.from(selectedFiles).forEach((f, i) => {
                            if (i !== index) dt.items.add(f);
                          });
                          setSelectedFiles(dt.files.length > 0 ? dt.files : null);
                        }}
                        className="text-slate-400 hover:text-red-400 h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2"
              data-testid="button-submit"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}