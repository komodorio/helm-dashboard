import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ApplicationStatus } from "./interfaces";
import apiService from "./apiService";

// Shuts down the Helm Dashboard application
export function useShutdownHelmDashboard(
  options?: UseMutationOptions<void, Error>
) {
  return useMutation<void, Error>(
    () =>
      apiService.fetchWithDefaults("/", {
        method: "DELETE",
      }),
    options
  );
}

// Gets application status
export function useGetApplicationStatus(
  options?: UseQueryOptions<ApplicationStatus>
) {
  return useQuery<ApplicationStatus>(
    ["status"],
    () => apiService.fetchWithDefaults<ApplicationStatus>("/status"),
    {
      ...options,
    }
  );
}
