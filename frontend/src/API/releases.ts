import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ChartVersion, Release } from "../data/types";
import { isNewerVersion } from "../utils";

import apiService from "./apiService";
import type { LatestChartVersion } from "./interfaces";
import { getVersionManifestFormData } from "./shared";

export const HD_RESOURCE_CONDITION_TYPE = "hdHealth"; // it's our custom condition type, only one exists

export function useGetInstalledReleases(context: string) {
  return useQuery<Release[]>({
    queryKey: ["installedReleases", context],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<Release[]>({
        url: "/api/helm/releases",
        fallback: [],
      }),
    retry: false,
  });
}

export interface ReleaseManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
  };
  spec: {
    replicas: number;
    selector: Record<string, string>;
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: {
          name: string;
          image: string;
          ports: {
            containerPort: number;
          }[];
          env: {
            name: string;
            value: string;
          }[];
        }[];
      };
    };
  };
}

export function useGetReleaseManifest({
  namespace,
  chartName,
  options,
}: {
  namespace: string;
  chartName: string;
  options?: UseQueryOptions<ReleaseManifest[]>;
}) {
  return useQuery<ReleaseManifest[]>({
    queryKey: ["manifest", namespace, chartName],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<ReleaseManifest[]>({
        url: `/api/helm/releases/${namespace}/${chartName}/manifests`,
        fallback: [],
      }),
    ...(options ?? {}),
  });
}

// List of installed k8s resources for this release
export function useGetResources(ns: string, name: string, enabled?: boolean) {
  return useQuery<StructuredResources[]>({
    queryKey: ["resources", ns, name],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<StructuredResources[]>({
        url: `/api/helm/releases/${ns}/${name}/resources?health=true`,
        fallback: [],
      }),
    select: (data) =>
      data
        ?.map((resource) => ({
          ...resource,
          status: {
            ...resource.status,
            conditions: resource.status.conditions.filter(
              (c) => c.type === HD_RESOURCE_CONDITION_TYPE
            ),
          },
        }))
        .sort((a, b) => {
          const interestingResources = [
            "STATEFULSET",
            "DEAMONSET",
            "DEPLOYMENT",
          ];
          return (
            interestingResources.indexOf(b.kind.toUpperCase()) -
            interestingResources.indexOf(a.kind.toUpperCase())
          );
        }),
    enabled,
  });
}

export function useGetResourceDescription(
  type: string,
  ns: string,
  name: string,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>({
    queryKey: ["describe", type, ns, name],
    queryFn: () =>
      apiService.fetchWithDefaults<string>(
        `/api/k8s/${type}/describe?name=${name}&namespace=${ns}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {}),
  });
}
export function useGetLatestVersion(
  chartName: string,
  options?: UseQueryOptions<ChartVersion[]>
) {
  return useQuery<ChartVersion[]>({
    queryKey: ["latestver", chartName],
    queryFn: () =>
      apiService.fetchWithSafeDefaults<ChartVersion[]>({
        url: `/api/helm/repositories/latestver?name=${chartName}`,
        fallback: [],
      }),
    gcTime: 0,
    ...(options ?? {}),
  });
}
export function useGetVersions(
  chartName: string,
  options?: UseQueryOptions<LatestChartVersion[]>
) {
  return useQuery<LatestChartVersion[]>({
    queryKey: ["versions", chartName],
    queryFn: async () => {
      const url = `/api/helm/repositories/versions?name=${chartName}`;
      return await apiService.fetchWithSafeDefaults<LatestChartVersion[]>({
        url,
        fallback: [],
      });
    },
    select: (data) =>
      data?.sort((a, b) => (isNewerVersion(a.version, b.version) ? 1 : -1)),
    ...(options ?? {}),
  });
}

export function useGetReleaseInfoByType(
  params: ReleaseInfoParams,
  additionalParams = "",
  options?: UseQueryOptions<string>
) {
  const { chart, namespace, tab, revision } = params;
  return useQuery<string>({
    queryKey: [tab, namespace, chart, revision, additionalParams],
    queryFn: () =>
      apiService.fetchWithDefaults<string>(
        `/api/helm/releases/${namespace}/${chart}/${tab}?revision=${revision}${additionalParams}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {}),
  });
}

export function useGetDiff(
  formData: FormData,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>({
    queryKey: ["diff", formData],
    queryFn: () => {
      return apiService.fetchWithDefaults<string>("/diff", {
        body: formData,

        method: "POST",
      });
    },
    ...(options ?? {}),
  });
}

// Rollback the release to a previous revision
export function useRollbackRelease(
  options?: UseMutationOptions<
    string,
    Error,
    { ns: string; name: string; revision: number }
  >
) {
  return useMutation<
    string,
    Error,
    { ns: string; name: string; revision: number }
  >({
    mutationFn: ({ ns, name, revision }) => {
      const formData = new FormData();
      formData.append("revision", revision.toString());

      return apiService.fetchWithDefaults<string>(
        `/api/helm/releases/${ns}/${name}/rollback`,
        {
          method: "POST",
          body: formData,
        }
      );
    },
    ...(options ?? {}),
  });
}

// Run the tests on a release
export function useTestRelease(
  options?: UseMutationOptions<string, Error, { ns: string; name: string }>
) {
  return useMutation<string, Error, { ns: string; name: string }>({
    mutationFn: ({ ns, name }) => {
      return apiService.fetchWithDefaults<string>(
        `/api/helm/releases/${ns}/${name}/test`,
        {
          method: "POST",
        }
      );
    },
    ...(options ?? {}),
  });
}

export function useChartReleaseValues({
  namespace = "default",
  release,
  userDefinedValue,
  revision,
  options,
  version,
}: {
  namespace?: string;
  release: string;
  userDefinedValue?: string;
  revision?: number;
  version?: string;
  options?: UseQueryOptions<string>;
}) {
  return useQuery<string>({
    queryKey: ["values", namespace, release, userDefinedValue, version],
    queryFn: () =>
      apiService.fetchWithDefaults(
        `/api/helm/releases/${namespace}/${release}/values?${"userDefined=true"}${
          revision ? `&revision=${revision}` : ""
        }`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {}),
  });
}

export type VersionData = {
  version: string;
  repository?: string;
  urls: string[];
};

export const useVersionData = ({
  version,
  userValues,
  chartAddress,
  releaseValues,
  namespace,
  releaseName,
  isInstallRepoChart = false,
  enabled = true,
}: {
  version: string;
  userValues: string;
  chartAddress: string;
  releaseValues: string;
  namespace: string;
  releaseName: string;
  isInstallRepoChart?: boolean;
  enabled?: boolean;
}) => {
  return useQuery<{ [key: string]: string }>({
    queryKey: [
      version,
      userValues,
      chartAddress,
      releaseValues,
      namespace,
      releaseName,
      isInstallRepoChart,
    ],
    queryFn: async () => {
      const formData = getVersionManifestFormData({
        version,
        userValues,
        chart: chartAddress,
        releaseValues,
        releaseName,
      });

      const url = isInstallRepoChart
        ? `/api/helm/releases/${namespace || "default"}`
        : `/api/helm/releases/${
            namespace ? namespace : "[empty]"
          }${`/${releaseName}`}`;

      return await apiService.fetchWithSafeDefaults<{
        [key: string]: string;
      }>({
        url,
        options: {
          method: "post",
          body: formData,
        },
        fallback: {},
      });
    },

    enabled,
  });
};

// Request objects
interface ReleaseInfoParams {
  chart?: string;
  tab: string;
  namespace?: string;
  revision?: string;
}

export interface StructuredResources {
  kind: string;
  apiVersion: string;
  metadata: Metadata;
  spec: Spec;
  status: Status;
}

export interface Metadata {
  name: string;
  namespace: string;
  creationTimestamp: Date;
  labels: string[];
}

export interface Spec {
  [key: string]: string;
}

export interface Status {
  conditions: Condition[];
}

export interface Condition {
  type: string;
  status: string;
  lastProbeTime: Date;
  lastTransitionTime: Date;
  reason: string;
  message: string;
}
