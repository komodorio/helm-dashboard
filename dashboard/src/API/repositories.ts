import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { callApi } from "./releases"
import {
//   ChartList,
//   ChartVersions,
  HelmRepositories,
//   LatestChartVersion,
//   ValuesYamlText,
} from "./interfaces"

// Get list of Helm repositories
export function useGetRepositories(
  options?: UseQueryOptions<HelmRepositories>
) {
  return useQuery<HelmRepositories>(
    ["helm", "repositories"],
    () => callApi<HelmRepositories>("/api/helm/repositories"),
    options
  )
}

// Add new repository
// function useAddRepository(
//   options?: UseMutationOptions<void, unknown, { name: string; url: string }>
// ) {
//   return useMutation<void, unknown, { name: string; url: string }>(
//     ({ name, url }) => {
//       const formData = new FormData()
//       formData.append("name", name)
//       formData.append("url", url)

//       return callApi<void>("/api/helm/repositories", {
//         method: "POST",
//         body: formData,
//       })
//     },
//     options
//   )
// }

// Get list of charts in repository
// function useGetChartsInRepo(
//   repo: string,
//   options?: UseQueryOptions<ChartList>
// ) {
//   return useQuery<ChartList>(
//     ["helm", "repositories", repo],
//     () => callApi<ChartList>(`/api/helm/repositories/${repo}`),
//     options
//   )
// }

// Update repository from remote
export function useUpdateRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return callApi<void>(`/api/helm/repositories/${repo}`, {
      method: "POST",
    })
  }, options)
}

// Remove repository
export function useDeleteRepo(
  repo: string,
  options?: UseMutationOptions<void, unknown, void>
) {
  return useMutation<void, unknown, void>(() => {
    return callApi<void>(`/api/helm/repositories/${repo}`, {
      method: "DELETE",
    })
  }, options)
}

// Find the latest available version of specified chart through all the repositories
// function useGetLatestChartVersion(
//   name: string,
//   options?: UseQueryOptions<LatestChartVersion>
// ) {
//   return useQuery<LatestChartVersion>(
//     ["helm", "repositories", "latestver", name],
//     () =>
//       callApi<LatestChartVersion>(
//         `/api/helm/repositories/latestver?name=${name}`
//       ),
//     options
//   )
// }

// // Get the list of versions for specified chart across the repositories
// function useGetChartVersions(
//   name: string,
//   options?: UseQueryOptions<ChartVersions>
// ) {
//   return useQuery<ChartVersions>(
//     ["helm", "repositories", "versions", name],
//     () =>
//       callApi<ChartVersions>(`/api/helm/repositories/versions?name=${name}`),
//     options
//   )
// }

// Get the original values.yaml file for the chart
// function useGetChartValues(
//   chart: string,
//   version: string,
//   options?: UseQueryOptions<ValuesYamlText>
// ) {
//   return useQuery<ValuesYamlText>(
//     ["helm", "repositories", "values", chart, version],
//     () =>
//       callApi<ValuesYamlText>(
//         `/api/helm/repositories/values?chart=${chart}&version=${version}`
//       ),
//     options
//   )
// }

export function useChartRepoValues(
  namespace: string,
  version: string,
  chart: string,
  options?: UseQueryOptions<any>
) {
  return useQuery<any>(
    ["values", namespace, chart],
    () =>
      callApi<any>(
        `/api/helm/repositories/values?chart=${chart}&version=${version}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    options
  )
}
