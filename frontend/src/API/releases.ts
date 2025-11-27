import {
  useQuery,
  type UseQueryOptions,
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { ChartVersion, Release } from "../data/types";
import { LatestChartVersion } from "./interfaces";
import apiService from "./apiService";
import { getVersionManifestFormData } from "./shared";
export const HD_RESOURCE_CONDITION_TYPE = "hdHealth"; // it's our custom condition type, only one exists

export function useGetInstalledReleases(
  context: string,
  options?: UseQueryOptions<Release[]>
) {
  return useQuery<Release[]>({
    queryKey:["installedReleases", context],
    queryFn: () => apiService.fetchWithDefaults<Release[]>("/api/helm/releases"),
    ...(options ?? {})}
  );
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
    queryKey:["manifest", namespace, chartName],
    queryFn:() =>
      apiService.fetchWithDefaults<ReleaseManifest[]>(
        `/api/helm/releases/${namespace}/${chartName}/manifests`
      ),
    ...(options ?? {})}
  );
}

// List of installed k8s resources for this release
export function useGetResources(
  ns: string,
  name: string,
  options?: UseQueryOptions<StructuredResources[]>
) {
  const { data, ...rest } = useQuery<StructuredResources[]>({
    queryKey:["resources", ns, name],
    queryFn:() =>
      apiService.fetchWithDefaults<StructuredResources[]>(
        `/api/helm/releases/${ns}/${name}/resources?health=true`
      ),
    ...(options ?? {})}
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
  return useQuery<string>({
    queryKey:["describe", type, ns, name],
    queryFn:() =>
      apiService.fetchWithDefaults<string>(
        `/api/k8s/${type}/describe?name=${name}&namespace=${ns}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {})}
  );
}
export function useGetLatestVersion(
  chartName: string,
  options?: UseQueryOptions<ChartVersion[]>
) {
  return useQuery<ChartVersion[]>({
    queryKey:["latestver", chartName],
    queryFn:() =>
      apiService.fetchWithDefaults<ChartVersion[]>(
        `/api/helm/repositories/latestver?name=${chartName}`
      ),
...(options ?? {})}
  );
}
export function useGetVersions(
  chartName: string,
  options?: UseQueryOptions<LatestChartVersion[]>
) {
  return useQuery<LatestChartVersion[]>({
    queryKey: ["versions", chartName],
    queryFn: () =>
      apiService.fetchWithDefaults<LatestChartVersion[]>(
        `/api/helm/repositories/versions?name=${chartName}`
      ),
    ...(options ?? {})}
  );
}

export function useGetReleaseInfoByType(
  params: ReleaseInfoParams,
  additionalParams = "",
  options?: UseQueryOptions<string>
) {
  const { chart, namespace, tab, revision } = params;
  return useQuery<string>({
    queryKey:[tab, namespace, chart, revision, additionalParams],
    queryFn:() =>
      apiService.fetchWithDefaults<string>(
        `/api/helm/releases/${namespace}/${chart}/${tab}?revision=${revision}${additionalParams}`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {})}
  );
}

export function useGetDiff(
  formData: FormData,
  options?: UseQueryOptions<string>
) {
  return useQuery<string>({
    queryKey:["diff", formData],
    queryFn:() => {
      return apiService.fetchWithDefaults<string>("/diff", {
        body: formData,

        method: "POST",
      });
    },
    ...(options ?? {})}
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
  >({mutationFn:({ ns, name, revision }) => {
    const formData = new FormData();
    formData.append("revision", revision.toString());

    return apiService.fetchWithDefaults<void>(
      `/api/helm/releases/${ns}/${name}/rollback`,
      {
        method: "POST",
        body: formData,
      }
    );
  }, ...(options ?? {})});
}

// Run the tests on a release
export function useTestRelease(
  options?: UseMutationOptions<void, unknown, { ns: string; name: string }>
) {
  return useMutation<void, unknown, { ns: string; name: string }>({
    mutationFn:({ ns, name }) => {
      return apiService.fetchWithDefaults<void>(
        `/api/helm/releases/${ns}/${name}/test`,
        {
          method: "POST",
        }
      );
    },
...(options ?? {})}
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
  options?: UseQueryOptions<unknown>;
}) {
  return useQuery<unknown>({
    queryKey:["values", namespace, release, userDefinedValue, version],
    queryFn:() =>
      apiService.fetchWithDefaults<unknown>(
        `/api/helm/releases/${namespace}/${release}/values?${"userDefined=true"}${
          revision ? `&revision=${revision}` : ""
        }`,
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      ),
    ...(options ?? {})}
  );
}

export const useVersionData = ({
  version,
  userValues,
  chartAddress,
  releaseValues,
  namespace,
  releaseName,
  isInstallRepoChart = false,
  options,
}: {
  version: string;
  userValues: string;
  chartAddress: string;
  releaseValues: string;
  namespace: string;
  releaseName: string;
  isInstallRepoChart?: boolean;
  options?: UseQueryOptions;
}) => {
  return useQuery({
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

      const fetchUrl = isInstallRepoChart
        ? `/api/helm/releases/${namespace || "default"}`
        : `/api/helm/releases/${
            namespace ? namespace : "[empty]"
          }${`/${releaseName}`}`;

      const data = await apiService.fetchWithDefaults(fetchUrl, {
        method: "post",
        body: formData,
      });

      return data;
    },

    ...(options ?? {})
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
