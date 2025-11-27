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
  return useMutation<void, Error>({
    mutationFn:() =>
      apiService.fetchWithDefaults("/", {
        method: "DELETE",
      }),
...(options ?? {})}
  );
}

// Gets application status
export function useGetApplicationStatus(
  options?: UseQueryOptions<ApplicationStatus>
) {
  return useQuery<ApplicationStatus>({
    queryKey: ["status"],
    queryFn: () => apiService.fetchWithDefaults<ApplicationStatus>("/status"),
      ...(options ?? {}),
  });
}
