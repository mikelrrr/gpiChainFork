import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthUser extends User {
  inviter?: User;
  inviteCount: number;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useSetupRequired() {
  const { data, isLoading } = useQuery<{ setupRequired: boolean }>({
    queryKey: ["/api/auth/setup-required"],
    retry: false,
  });

  return {
    setupRequired: data?.setupRequired ?? false,
    isLoading,
  };
}
