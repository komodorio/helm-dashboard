/* eslint-disable @typescript-eslint/no-unused-vars */
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { K8sResource, K8sResourceList, KubectlContexts } from "./interfaces";
import apiService from "./apiService";

// Get list of kubectl contexts configured locally
function useGetKubectlContexts(options?: UseQueryOptions<KubectlContexts>) {
  return useQuery<KubectlContexts >({ queryKey: ["k8s", "contexts"],queryFn:() =>apiService.fetchWithDefaults<KubectlContexts>("/api/k8s/contexts"),
    ...(options ??{}),
  });
}

// Get resources information
function useGetK8sResource(
  kind: string,
  name: string,
  namespace: string,
  options?: UseQueryOptions<K8sResource>
) {
  return useQuery<K8sResource>({
    queryKey: ["k8s", kind, "get", name, namespace],
    queryFn: () =>
      apiService.fetchWithDefaults<K8sResource>(
        `/api/k8s/${kind}/get?name=${name}&namespace=${namespace}`
      ),
    ...(options ?? {}),
  });
}

// Get list of resources
function useGetK8sResourceList(
  kind: string,
  options?: UseQueryOptions<K8sResourceList>
) {
  return useQuery<K8sResourceList>({
    queryKey: ["k8s", kind, "list"],
    queryFn: () =>
      apiService.fetchWithDefaults<K8sResourceList>(`/api/k8s/${kind}/list`),
    ...(options ?? {}),
  });
}

// Get describe text for kubernetes resource
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
