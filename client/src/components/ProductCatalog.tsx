import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Copy, 
  ArrowUpDown,
  Bot,
  Globe,
  Mic,
  Package,
  Cpu,
  Zap,
  Download,
  Upload,
  FileText
} from "lucide-react";
import ProductForm from "./ProductForm";
import type { Product } from "@shared/schema";

const productIcons = {
  "AI Chatbot": Bot,
  "AI Website Builder": Globe,
  "Voice AI Assistant": Mic,
  "AI Analytics": Cpu,
  "AI Automation": Zap,
  default: Package,
};

const priorityColors = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Low: "text-slate-400",
};

const profitColors = {
  "High Profit": "bg-emerald-500/20 text-emerald-400",
  "Standard": "bg-amber-500/20 text-amber-400",
  "Low Margin": "bg-slate-500/20 text-slate-400",
};

export default function ProductCatalog() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { id, createdAt, ...productData } = product;
      await apiRequest("POST", "/api/products", {
        ...productData,
        name: `${product.name} (Copy)`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product duplicated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate product",
      });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDuplicate = (product: Product) => {
    duplicateMutation.mutate(product);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const getProductIcon = (name: string) => {
    const IconComponent = productIcons[name as keyof typeof productIcons] || productIcons.default;
    return IconComponent;
  };

  const isAdmin = ((user as any)?.user?.role || user?.role) === "admin";

  // Export products to CSV
  const exportProducts = () => {
    if (products.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No products available to export",
      });
      return;
    }

    const headers = [
      "Name",
      "Price", 
      "Priority",
      "Profit Level",
      "Pitch",
      "Talking Points",
      "Agent Notes",
      "Tags"
    ];

    const csvData = products.map((product: Product) => [
      product.name,
      product.price,
      product.priority,
      product.profitLevel,
      product.pitch || "",
      product.talkingPoints || "",
      product.agentNotes || "",
      (product.tags || []).join("; ")
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: `Exported ${products.length} products to CSV`,
    });
  };

  // Handle file import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a CSV file",
      });
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File must contain headers and at least one data row");
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const products = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const productData: any = {
          name: values[0] || "",
          price: values[1] || "",
          priority: ["High", "Medium", "Low"].includes(values[2]) ? values[2] : "Medium",
          profitLevel: ["High Profit", "Standard", "Low Margin"].includes(values[3]) ? values[3] : "Standard",
          pitch: values[4] || "",
          talkingPoints: values[5] || "",
          agentNotes: values[6] || "",
          tags: values[7] ? values[7].split(';').map(t => t.trim()).filter(t => t) : []
        };

        if (!productData.name) {
          throw new Error(`Row ${index + 2}: Product name is required`);
        }
        if (!productData.price) {
          throw new Error(`Row ${index + 2}: Product price is required`);
        }

        return productData;
      });

      // Import products one by one
      for (const productData of products) {
        await apiRequest("POST", "/api/products", productData);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: `Imported ${products.length} products successfully`,
      });

    } catch (error) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import products",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-800/30 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Catalog</h2>
          <p className="text-slate-400 mt-1">AI Service offerings and sales guidance</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Export Button - Available to all users */}
          <Button
            variant="outline"
            onClick={exportProducts}
            className="flex items-center space-x-2"
            data-testid="button-export-products"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>

          {isAdmin && (
            <>
              {/* Import Button - Admin only */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
                data-testid="button-import-products"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </Button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              
              {/* Add Product Button */}
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                data-testid="button-add-product"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: Product) => {
          const Icon = getProductIcon(product.name);
          
          return (
            <Card
              key={product.id}
              className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/30 transition-all group"
              data-testid={`card-product-${product.id}`}
            >
              <CardContent className="p-6">
                {/* Product Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className={`text-sm ${priorityColors[product.priority as keyof typeof priorityColors]}`}>
                        {product.priority} Priority
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400" data-testid={`text-product-price-${product.id}`}>
                      {product.price}
                    </p>
                    <Badge className={profitColors[product.profitLevel as keyof typeof profitColors]}>
                      {product.profitLevel}
                    </Badge>
                  </div>
                </div>

                {/* Product Description */}
                <p className="text-sm text-slate-300 mb-4 line-clamp-3" data-testid={`text-product-pitch-${product.id}`}>
                  {product.pitch || "No description available"}
                </p>

                {/* Sales Information */}
                <div className="space-y-3 mb-4">
                  {product.talkingPoints && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">PITCH POINTS:</p>
                      <p className="text-xs text-slate-300 line-clamp-2" data-testid={`text-talking-points-${product.id}`}>
                        {product.talkingPoints}
                      </p>
                    </div>
                  )}
                  
                  {product.agentNotes && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">AGENT NOTES:</p>
                      <p className="text-xs text-slate-300 line-clamp-2" data-testid={`text-agent-notes-${product.id}`}>
                        {product.agentNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-slate-700/50 text-slate-300"
                        data-testid={`badge-tag-${product.id}-${index}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg"
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(product)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg"
                        data-testid={`button-copy-${product.id}`}
                      >
                        <Copy className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-400 hover:text-slate-300"
                      data-testid={`button-reorder-${product.id}`}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      Reorder
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Products Available</h3>
            <p className="text-slate-400 mb-6">
              {isAdmin ? "Add your first AI service product to get started or import from CSV." : "No products have been configured yet."}
            </p>
            {isAdmin && (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductForm(true);
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import CSV</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
