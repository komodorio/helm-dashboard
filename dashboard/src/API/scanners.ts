/** DO NOT DELETE THESE FUNCTIONS - we left this until we support scan ops again */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { callApi } from "./releases";
import { ScanResult, ScanResults, ScannersList } from "./interfaces";

// Get list of discovered scanners
function useGetDiscoveredScanners(options?: UseQueryOptions<ScannersList>) {
  return useQuery<ScannersList>(
    ["scanners"],
    () => callApi<ScannersList>("/api/scanners"),
    options
  );
}

// Scan manifests using all applicable scanners
function useScanManifests(
  manifest: string,
  options?: UseMutationOptions<ScanResults, Error, string>
) {
  const formData = new FormData();
  formData.append("manifest", manifest);
  return useMutation<ScanResults, Error, string>(
    () =>
      callApi<ScanResults>("/api/scanners/manifests", {
        method: "POST",
        body: formData,
      }),
    options
  );
}

// Scan specified k8s resource in cluster
function useScanK8sResource(
  kind: string,
  namespace: string,
  name: string,
  options?: UseQueryOptions<ScanResults>
) {
  return useQuery<ScanResults>(
    ["scanners", "resource", kind, namespace, name],
    () =>
      callApi<ScanResults>(
        `/api/scanners/resource/${kind}?namespace=${namespace}&name=${name}`
      ),
    options
  );
}
