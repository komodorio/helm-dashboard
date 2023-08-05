import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { callApi } from "./releases";
import { HelmRepositories } from "./interfaces";

// Get list of Helm repositories
export function useGetRepositories(
  options?: UseQueryOptions<HelmRepositories>
) {
  return useQuery<HelmRepositories>(
    ["helm", "repositories"],
    () => callApi<HelmRepositories>("/api/helm/repositories"),
    options
  );
}

// Update repository from remote
export function useUpdateRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return callApi<void>(`/api/helm/repositories/${repo}`, {
      method: "POST",
    });
  }, options);
}

// Remove repository
export function useDeleteRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return callApi<void>(`/api/helm/repositories/${repo}`, {
      method: "DELETE",
    });
  }, options);
}

export function useChartRepoValues({
  version,
  chart,
}: {
  version: string;
  chart: string;
}) {
  return useQuery<any>(
    ["helm", "repositories", "values", chart, version],
    () =>
      callApi<any>(
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
