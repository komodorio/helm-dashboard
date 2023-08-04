import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { callApi } from "./releases";
import { ApplicationStatus } from "./interfaces";

// Shuts down the Helm Dashboard application
export function useShutdownHelmDashboard(
  options?: UseMutationOptions<void, Error>
) {
  return useMutation<void, Error>(
    () =>
      callApi("/", {
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
    () => callApi<ApplicationStatus>("/status"),
    {
      ...options,
    }
  );
}
