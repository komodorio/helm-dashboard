import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { ApplicationStatus } from "./interfaces";
import apiService from "./apiService";

// Shuts down the Helm Dashboard application
export function useShutdownHelmDashboard(
  options?: UseMutationOptions<string, Error>
) {
  return useMutation<string, Error>({
    mutationFn: () =>
      apiService.fetchWithDefaults("/", {
        method: "DELETE",
      }),
    ...(options ?? {}),
  });
}

// Gets application status
export function useGetApplicationStatus(
  options?: UseQueryOptions<ApplicationStatus | null>
) {
  return useQuery<ApplicationStatus | null>({
    queryKey: ["status"],
    queryFn: async () =>
      await apiService.fetchWithSafeDefaults<ApplicationStatus | null>({
        url: "/status",
        fallback: null,
      }),

    ...(options ?? {}),
  });
}
