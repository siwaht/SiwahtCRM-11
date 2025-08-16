import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [formData, setFormData] = useState<Partial<InsertUser>>({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
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

    mutation.mutate(formData);
  };

  const handleChange = (field: keyof InsertUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {user ? "Edit User" : "Add New User"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
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
              <Label htmlFor="email" className="text-slate-300">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                required
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                value={formData.username || ""}
                onChange={(e) => handleChange("username", e.target.value)}
                className="mt-1 bg-slate-800/50 border-slate-700"
                placeholder="Optional"
                data-testid="input-username"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700" data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-300">
              Password {user ? "(leave empty to keep current)" : "*"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="mt-1 bg-slate-800/50 border-slate-700"
              required={!user}
              data-testid="input-password"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive || false}
              onCheckedChange={(checked) => handleChange("isActive", checked === true)}
              data-testid="checkbox-active"
            />
            <Label htmlFor="isActive" className="text-slate-300">
              Active User
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
              {mutation.isPending ? "Saving..." : (user ? "Update User" : "Create User")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}