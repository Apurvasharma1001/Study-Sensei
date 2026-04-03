import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type DeleteAccountInput,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
  type UpdateProfileInput,
} from "@shared/schema";
import { apiGet, apiSend, type ApiEnvelope } from "@/lib/api";

type UserPayload = {
  user: PublicUser;
};

type MessagePayload = {
  message: string;
};

const PROFILE_QUERY_KEY = ["/api/user/profile"] as const;

function buildUserEnvelope(user: PublicUser): ApiEnvelope<UserPayload> {
  return {
    data: {
      user,
    },
  };
}

export function useAuth() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<ApiEnvelope<UserPayload> | null>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () =>
      await apiGet<ApiEnvelope<UserPayload>>("/api/user/profile", {
        on401: "returnNull",
      }),
  });

  const setUser = (user: PublicUser | null) => {
    queryClient.setQueryData<ApiEnvelope<UserPayload> | null>(
      PROFILE_QUERY_KEY,
      user ? buildUserEnvelope(user) : null,
    );
  };

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginInput) =>
      await apiSend<ApiEnvelope<UserPayload>, LoginInput>(
        "POST",
        "/api/auth/login",
        payload,
      ),
    onSuccess: (response) => {
      setUser(response.data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterInput) =>
      await apiSend<ApiEnvelope<UserPayload>, RegisterInput>(
        "POST",
        "/api/auth/register",
        payload,
      ),
    onSuccess: (response) => {
      setUser(response.data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () =>
      await apiSend<ApiEnvelope<MessagePayload>>("POST", "/api/auth/logout"),
    onSuccess: async () => {
      setUser(null);
      await queryClient.invalidateQueries();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfileInput) =>
      await apiSend<ApiEnvelope<UserPayload>, UpdateProfileInput>(
        "PATCH",
        "/api/user/profile",
        payload,
      ),
    onSuccess: (response) => {
      setUser(response.data.user);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (payload: DeleteAccountInput) =>
      await apiSend<ApiEnvelope<MessagePayload>, DeleteAccountInput>(
        "DELETE",
        "/api/user/account",
        payload,
      ),
    onSuccess: async () => {
      setUser(null);
      queryClient.clear();
    },
  });

  return {
    user: profileQuery.data?.data.user ?? null,
    isAuthenticated: Boolean(profileQuery.data?.data.user),
    isLoading: profileQuery.isPending,
    error: profileQuery.error,
    refetchUser: profileQuery.refetch,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    loginMutation,
    registerMutation,
    logoutMutation,
    updateProfileMutation,
    deleteAccountMutation,
  };
}
