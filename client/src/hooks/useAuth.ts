import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear();
      setLocation("/login");
    },
  });

  const login = async (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: error ? null : user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
