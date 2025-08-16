import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

export default function UserForm({ user, onClose }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<InsertUser> & { profilePhoto?: File | null; idDocument?: File | null }>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    phone: user?.phone || "",
    address: user?.address || "",
    profilePhoto: null,
    idDocument: null,
    password: "",
    role: user?.role || "agent",
    isActive: user?.isActive ?? true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      if (user) {
        // Don't send password if it's empty (keeping existing password)
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        return await apiRequest("PUT", `/api/users/${user.id}`, updateData);
      } else {
        return await apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: user ? "User updated successfully" : "User created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${user ? "update" : "create"} user`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password is required for new users",
      });
      return;
    }

    // Create form data with auto-generated name from first + last name
    const submissionData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim() || formData.name,
    };
    
    // Remove file fields from API submission (handle file uploads separately)
    const { profilePhoto, idDocument, ...apiData } = submissionData;
    
    mutation.mutate(apiData);
  };

  const handleChange = (field: keyof InsertUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {user ? "Edit Agent" : "Add New Agent"}
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            Update agent information and permissions
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="block text-slate-300 font-medium">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="bg-slate-800/50 border-slate-700"
                required
                data-testid="input-first-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="block text-slate-300 font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="bg-slate-800/50 border-slate-700"
                required
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="block text-slate-300 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="bg-slate-800/50 border-slate-700"
              required
              data-testid="input-email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="block text-slate-300 font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-slate-800/50 border-slate-700"
                placeholder="+1 (555) 123-4567"
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="block text-slate-300 font-medium">Status</Label>
              <Select value={formData.isActive ? "Active" : "Inactive"} onValueChange={(value) => handleChange("isActive", value === "Active")}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="block text-slate-300 font-medium">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="bg-slate-800/50 border-slate-700 min-h-[80px]"
              placeholder="123 Main Street, City, State, ZIP"
              data-testid="textarea-address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="block text-slate-300 font-medium">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700" data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="block text-slate-300 font-medium">
              New Password {user ? "(leave blank to keep current)" : ""}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="bg-slate-800/50 border-slate-700"
              placeholder="Enter new password or leave blank"
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePhoto" className="block text-slate-300 font-medium">Profile Photo</Label>
            <Input
              id="profilePhoto"
              type="file"
              accept="image/*"
              onChange={(e) => handleChange("profilePhoto", e.target.files?.[0] || null)}
              className="bg-slate-800/50 border-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              data-testid="input-profile-photo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idDocument" className="block text-slate-300 font-medium">ID Document</Label>
            <Input
              id="idDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleChange("idDocument", e.target.files?.[0] || null)}
              className="bg-slate-800/50 border-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              data-testid="input-id-document"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
              {mutation.isPending ? "Saving..." : (user ? "Update Agent" : "Create Agent")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}