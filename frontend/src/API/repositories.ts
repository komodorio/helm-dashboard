import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { HelmRepositories } from "./interfaces";
import apiService from "./apiService";

// Get list of Helm repositories
export function useGetRepositories(
  options?: UseQueryOptions<HelmRepositories>
) {
  return useQuery<HelmRepositories>(
    ["helm", "repositories"],
    () =>
      apiService.fetchWithDefaults<HelmRepositories>("/api/helm/repositories"),
    options
  );
}

// Update repository from remote
export function useUpdateRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return apiService.fetchWithDefaults<void>(
      `/api/helm/repositories/${repo}`,
      {
        method: "POST",
      }
    );
  }, options);
}

// Remove repository
export function useDeleteRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return apiService.fetchWithDefaults<void>(
      `/api/helm/repositories/${repo}`,
      {
        method: "DELETE",
      }
    );
  }, options);
}

export function useChartRepoValues({
  version,
  chart,
}: {
  version: string;
  chart: string;
}) {
  return useQuery<string>(
    ["helm", "repositories", "values", chart, version],
    () =>
      apiService.fetchWithDefaults<string>(
        `/api/helm/repositories/values?chart=${chart}&version=${version}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    {
      enabled: Boolean(version) && Boolean(chart),
    }
  );
}
