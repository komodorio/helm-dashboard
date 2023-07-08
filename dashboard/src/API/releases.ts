import {
  useQuery,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { ChartVersion, Release } from "../data/types";
import { LatestChartVersion } from "./interfaces";
import ApiService from "./apiService";
import apiService from "./apiService";
export const HD_RESOURCE_CONDITION_TYPE = "hdHealth"; // it's our custom condition type, only one exists

export function useGetInstalledReleases(
  context: string,
  options?: UseQueryOptions<Release[]>
) {
  return useQuery<Release[]>(
    ["installedReleases", context],
    () =>
      callApi<Release[]>("/api/helm/releases", {
        headers: {
          "X-Kubecontext": context,
        },
      }),
    options
  );
}

// Install new release
function useInstallRelease(
  options?: UseMutationOptions<void, unknown, InstallReleaseRequest>
) {
  return useMutation<void, unknown, InstallReleaseRequest>((request) => {
    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return callApi<void>("/api/helm/releases/{ns}", {
      method: "POST",
      body: formData,
    });
  }, options);
}

// Upgrade/reconfigure existing release
function useUpgradeRelease(
  options?: UseMutationOptions<void, unknown, UpgradeReleaseRequest>
) {
  return useMutation<void, unknown, UpgradeReleaseRequest>((request) => {
    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return callApi<void>("/api/helm/releases/{ns}/{name}", {
      method: "POST",
      body: formData,
    });
  }, options);
}

export function useGetReleaseManifest(
  ns: string,
  name: string,
  formData: FormData,
  options?: UseQueryOptions<any>
) {
  return useQuery<any>(
    ["manifest", ns, name],
    () =>
      callApi<any>(`/api/helm/releases/${ns}/${name}`, {
        method: "post",
        body: formData,
      }),
    options
  );
}

/**
// Get manifest for release
function useGetManifest(ns: string, name: string, revision?: string, revisionDiff?: string, options?: UseQueryOptions<ManifestText>) {
  const queryParams = new URLSearchParams({ revision, revisionDiff }).toString();
  return useQuery<ManifestText>(['manifest', ns, name], () => callApi<ManifestText>(`/api/helm/releases/${ns}/${name}/manifest?${queryParams}`), options);
}

const queryParams = new URLSearchParams({ revision, revisionDiff, userDefined: userDefined ? 'true' : undefined }).toString();
  return useQuery<ValuesYamlText>(['values', ns, name], () => callApi<ValuesYamlText>(`/api/helm/releases/${ns}/${name}/values?${queryParams}`), options);
}

// Get textual notes for release
function useGetNotes(ns: string, name: string, revision?: string, revisionDiff?: string, options?: UseQueryOptions<NotesText>) {
  const queryParams = new URLSearchParams({ revision, revisionDiff }).toString();
  return useQuery<NotesText>(['notes', ns, name], () => callApi<NotesText>(`/api/helm/releases/${ns}/${name}/notes?${queryParams}`), options);
}

*/
// List of installed k8s resources for this release
export function useGetResources(
  ns: string,
  name: string,
  options?: UseQueryOptions<StructuredResources[]>
) {
  const { data, ...rest } = useQuery<StructuredResources[]>(
    ["resources", ns, name],
    () =>
      callApi<StructuredResources[]>(
        `/api/helm/releases/${ns}/${name}/resources?health=true`
      ),
    options
  );

  return {
    data: data
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
        const interestingResources = ["STATEFULSET", "DEAMONSET", "DEPLOYMENT"];
        return (
          interestingResources.indexOf(b.kind.toUpperCase()) -
          interestingResources.indexOf(a.kind.toUpperCase())
        );
      }),
    ...rest,
  };
}

export function useGetResourceDescription(
  type: string,
  ns: string,
  name: string,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>(
    ["describe", type, ns, name],
    () =>
      callApi<string>(
        `/api/k8s/${type}/describe?name=${name}&namespace=${ns}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    options
  );
}
export function useGetLatestVersion(
  chartName: string,
  options?: UseQueryOptions<ChartVersion[]>
) {
  return useQuery<ChartVersion[]>(
    ["latestver", chartName],
    () =>
      callApi<ChartVersion[]>(
        `/api/helm/repositories/latestver?name=${chartName}`
      ),
    options
  );
}
export function useGetVersions(
  chartName: string,
  options?: UseQueryOptions<LatestChartVersion[]>
) {
  return useQuery<LatestChartVersion[]>(
    ["versions", chartName],
    () =>
      callApi<LatestChartVersion[]>(
        `/api/helm/repositories/versions?name=${chartName}`
      ),
    options
  );
}

export function useGetReleaseInfoByType(
  params: ReleaseInfoParams,
  additionalParams = "",
  options?: UseQueryOptions<string>
) {
  const { chart, namespace, tab, revision } = params;
  return useQuery<string>(
    [tab, namespace, chart, revision, additionalParams],
    () =>
      callApi<string>(
        `/api/helm/releases/${namespace}/${chart}/${tab}?revision=${revision}${additionalParams}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    options
  );
}

export function useGetDiff(
  formData: FormData,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>(
    ["diff", formData],
    () => {
      return callApi<string>(`/diff`, {
        body: formData,

        method: "POST",
      });
    },
    options
  );
}

// Rollback the release to a previous revision
export function useRollbackRelease(
  options?: UseMutationOptions<
    void,
    unknown,
    { ns: string; name: string; revision: number }
  >
) {
  return useMutation<
    void,
    unknown,
    { ns: string; name: string; revision: number }
  >(({ ns, name, revision }) => {
    const formData = new FormData();
    formData.append("revision", revision.toString());

    return callApi<void>(`/api/helm/releases/${ns}/${name}/rollback`, {
      method: "POST",
      body: formData,
    });
  }, options);
}

// Run the tests on a release
export function useTestRelease(
  options?: UseMutationOptions<void, unknown, { ns: string; name: string }>
) {
  return useMutation<void, unknown, { ns: string; name: string }>(
    ({ ns, name }) => {
      return callApi<void>(`/api/helm/releases/${ns}/${name}/test`, {
        method: "POST",
      });
    },
    options
  );
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
  options?: UseQueryOptions<any>;
}) {
  return useQuery<any>(
    ["values", namespace, release, userDefinedValue, version],
    () =>
      callApi<any>(
        `/api/helm/releases/${namespace}/${release}/values?${"userDefined=true"}${
          revision ? `&revision=${revision}` : ""
        }`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    options
  );
}

// Request objects
interface ReleaseInfoParams {
  chart?: string;
  tab: string;
  namespace?: string;
  revision?: string;
}
interface InstallReleaseRequest {
  name: string;
  chart: string;
  version?: string;
  values?: string;
  preview?: boolean;
}

interface InstallReleaseRequest {
  name: string;
  chart: string;
  version?: string;
  values?: string;
  preview?: boolean;
}

interface UpgradeReleaseRequest {
  name: string;
  chart: string;
  version?: string;
  values?: string;
  preview?: boolean;
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
  creationTimestamp: any;
  labels: any;
}

export interface Spec {
  [key: string]: any;
}

export interface Status {
  conditions: Condition[];
}

export interface Condition {
  type: string;
  status: string;
  lastProbeTime: any;
  lastTransitionTime: any;
  reason: string;
  message: string;
}

export async function callApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiService.fetchWithDefaults(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  let data;
  if (!response.headers.get("Content-Type")) {
    return {} as T;
  } else if (response.headers.get("Content-Type")?.includes("text/plain")) {
    data = await response.text();
  } else {
    data = await response.json();
  }
  return data;
}
