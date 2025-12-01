import {
  Chart,
  ChartVersion,
  Release,
  ReleaseHealthStatus,
  ReleaseRevision,
} from "../data/types";
import { type QueryFunctionContext } from "@tanstack/react-query";

interface ClustersResponse {
  AuthInfo: string;
  Cluster: string;
  IsCurrent: boolean;
  Name: string;
  Namespace: string;
}
class ApiService {
  currentCluster = "";
  constructor(protected readonly isMockMode: boolean = false) {}

  setCluster = (cluster: string) => {
    this.currentCluster = cluster;
  };

  public async fetchWithDefaults<T>(
    url: string,
    options?: RequestInit
  ): Promise<T | string> {
    let response;

    if (this.currentCluster) {
      const headers = new Headers(options?.headers);
      if (!headers.has("X-Kubecontext")) {
        headers.set("X-Kubecontext", this.currentCluster);
      }
      response = await fetch(url, { ...options, headers });
    } else {
      response = await fetch(url, options);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType) {
      return {} as unknown as T;
    } else if (contentType.includes("text/plain")) {
      return await response.text();
    } else {
      return (await response.json()) as T;
    }
  }

  public async fetchWithSafeDefaults<T>({
    url,
    options,
    fallback,
  }: {
    url: string;
    options?: RequestInit;
    fallback: T;
  }): Promise<T> {
    const data = await this.fetchWithDefaults<T>(url, options);
    if (!data) {
      console.error(url, " response is empty");
      return fallback;
    }

    if (typeof data === "string") {
      console.error(url, " response is string");
      return fallback;
    }

    return data;
  }

  getToolVersion = async () => {
    return await this.fetchWithDefaults("/status");
  };

  getRepositoryLatestVersion = async (repositoryName: string) => {
    return await this.fetchWithDefaults(
      `/api/helm/repositories/latestver?name=${repositoryName}`
    );
  };

  getInstalledReleases = async () => {
    return await this.fetchWithDefaults("/api/helm/releases");
  };

  getClusters = async (): Promise<ClustersResponse[]> => {
    return await this.fetchWithSafeDefaults<ClustersResponse[]>({
      url: "/api/k8s/contexts",
      fallback: [],
    });
  };

  getNamespaces = async () => {
    return await this.fetchWithDefaults("/api/k8s/namespaces/list");
  };

  getRepositories = async () => {
    return await this.fetchWithDefaults("/api/helm/repositories");
  };

  getRepositoryCharts = async ({
    queryKey,
  }: {
    queryKey: readonly unknown[];
  }): Promise<Chart[]> => {
    const [, repository] = queryKey;
    if (!repository || typeof repository !== "string") {
      return [];
    }

    const url = `/api/helm/repositories/${repository}`;
    return await this.fetchWithSafeDefaults<Chart[]>({ url, fallback: [] });
  };

  getChartVersions = async ({
    queryKey,
  }: QueryFunctionContext<ChartVersion[], Chart>) => {
    const [, chart] = queryKey;

    return await this.fetchWithDefaults(
      `/api/helm/repositories/versions?name=${chart.name}`
    );
  };

  getResourceStatus = async ({
    release,
  }: {
    release: Release;
  }): Promise<ReleaseHealthStatus[]> => {
    if (!release) return [];

    return await this.fetchWithSafeDefaults<ReleaseHealthStatus[]>({
      url: `/api/helm/releases/${release.namespace}/${release.name}/resources?health=true`,
      fallback: [],
    });
  };

  getReleasesHistory = async ({
    queryKey,
  }: {
    queryKey: readonly [string, Record<string, string | undefined>];
  }): Promise<ReleaseRevision[]> => {
    const [, params] = queryKey;

    if (!params.namespace || !params.chart) return [];

    return await this.fetchWithSafeDefaults<ReleaseRevision[]>({
      url: `/api/helm/releases/${params.namespace}/${params.chart}/history`,
      fallback: [],
    });
  };

  getValues = async ({
    queryKey,
  }: {
    queryKey: [
      string,
      { namespace: string; chart: { name: string }; version: number },
    ];
  }) => {
    const [, params] = queryKey;
    const { namespace, chart, version } = params;

    if (!namespace || !chart || !chart.name || version === undefined)
      return Promise.reject(new Error("missing parameters"));

    const url = `/api/helm/repositories/values?chart=${namespace}/${chart.name}&version=${version}`;
    return await this.fetchWithDefaults(url);
  };
}

const apiService = new ApiService();

export default apiService;
