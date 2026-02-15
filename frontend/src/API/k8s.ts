/* eslint-disable @typescript-eslint/no-unused-vars */
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import apiService from "./apiService";
import type {
  K8sResource,
  K8sResourceList,
  KubectlContexts,
} from "./interfaces";

// Get list of kubectl contexts configured locally
// @ts-expect-error unused
function useGetKubectlContexts(options?: UseQueryOptions<KubectlContexts>) {
  return useQuery<KubectlContexts>({
    queryKey: ["k8s", "contexts"],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<KubectlContexts>({
        url: "/api/k8s/contexts",
        fallback: { contexts: [] },
      }),
    ...(options ?? {}),
  });
}

// Get resources information
// @ts-expect-error unused
function useGetK8sResource(
  kind: string,
  name: string,
  namespace: string,
  options?: UseQueryOptions<K8sResource>
) {
  return useQuery<K8sResource>({
    queryKey: ["k8s", kind, "get", name, namespace],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<K8sResource>({
        url: `/api/k8s/${kind}/get?name=${name}&namespace=${namespace}`,
        fallback: { kind: "", name: "", namespace: "" },
      }),
    ...(options ?? {}),
  });
}

// Get list of resources
// @ts-expect-error unused
function useGetK8sResourceList(
  kind: string,
  options?: UseQueryOptions<K8sResourceList>
) {
  return useQuery<K8sResourceList>({
    queryKey: ["k8s", kind, "list"],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<K8sResourceList>({
        url: `/api/k8s/${kind}/list`,
        fallback: { items: [] },
      }),
    ...(options ?? {}),
  });
}

// Get describe text for kubernetes resource
// @ts-expect-error unused
function useGetK8sResourceDescribe(
  kind: string,
  name: string,
  namespace: string,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>({
    queryKey: ["k8s", kind, "describe", name, namespace],
    queryFn: () =>
      apiService.fetchWithDefaults<string>(
        `/api/k8s/${kind}/describe?name=${name}&namespace=${namespace}`,
        {
          headers: {
            Accept: "text/plain",
          },
        }
      ),
    ...(options ?? {}),
  });
}
