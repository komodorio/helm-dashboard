/** DO NOT DELETE THESE FUNCTIONS - we left this until we support scan ops again */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ScanResult, ScanResults, ScannersList } from "./interfaces";
import apiService from "./apiService";

// Get list of discovered scanners
function useGetDiscoveredScanners(options?: UseQueryOptions<ScannersList>) {
  return useQuery<ScannersList>({
    queryKey: ["scanners"],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<ScannersList>({
        url: "/api/scanners",
        fallback: { scanners: [] },
      }),
    ...(options ?? {}),
  });
}

// Scan manifests using all applicable scanners
function useScanManifests(
  manifest: string,
  options?: UseMutationOptions<ScanResults, Error, string>
) {
  const formData = new FormData();
  formData.append("manifest", manifest);
  return useMutation<ScanResults, Error, string>({
    mutationFn: () =>
      apiService.fetchWithSafeDefaults<ScanResults>({
        url: "/api/scanners/manifests",
        options: {
          method: "POST",
          body: formData,
        },
        fallback: {},
      }),
    ...(options ?? {}),
  });
}

// Scan specified k8s resource in cluster
function useScanK8sResource(
  kind: string,
  namespace: string,
  name: string,
  options?: UseQueryOptions<ScanResults>
) {
  return useQuery<ScanResults>({
    queryKey: ["scanners", "resource", kind, namespace, name],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<ScanResults>({
        url: `/api/scanners/resource/${kind}?namespace=${namespace}&name=${name}`,
        fallback: {},
      }),
    ...(options ?? {}),
  });
}
