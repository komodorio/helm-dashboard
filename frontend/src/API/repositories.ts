import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { HelmRepositories } from "./interfaces";
import apiService from "./apiService";

// Get list of Helm repositories
export function useGetRepositories(
  options?: UseQueryOptions<HelmRepositories>
) {
  return useQuery<HelmRepositories>({
    queryKey: ["helm", "repositories"],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<HelmRepositories>({
        url: "/api/helm/repositories",
        fallback: [],
      }),
    select: (data) => data?.sort((a, b) => a?.name?.localeCompare(b?.name)),
    ...(options ?? {}),
  });
}

// Update repository from remote
export function useUpdateRepo(
  repo: string,
  options?: UseMutationOptions<string, Error>
) {
  return useMutation<string, Error>({
    mutationFn: () => {
      return apiService.fetchWithDefaults<string>(
        `/api/helm/repositories/${repo}`,
        {
          method: "POST",
        }
      );
    },
    ...(options ?? {}),
  });
}

// Remove repository
export function useDeleteRepo(
  repo: string,
  options?: UseMutationOptions<string, Error>
) {
  return useMutation<string, Error>({
    mutationFn: () => {
      return apiService.fetchWithDefaults<string>(
        `/api/helm/repositories/${repo}`,
        {
          method: "DELETE",
        }
      );
    },
    ...(options ?? {}),
  });
}

export function useChartRepoValues({
  version,
  chart,
}: {
  version: string;
  chart: string;
}) {
  return useQuery<string>({
    queryKey: ["helm", "repositories", "values", chart, version],
    queryFn: () =>
      apiService.fetchWithDefaults<string>(
        `/api/helm/repositories/values?chart=${chart}&version=${version}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    enabled: Boolean(version) && Boolean(chart),
  });
}
